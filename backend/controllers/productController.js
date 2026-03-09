const Product = require("../models/Product");
const Review = require("../models/Review");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const imageService = require("../services/imageService");
const cacheService = require("../services/cacheService");
const {
  buildPagination,
  paginationMeta,
  buildSortQuery,
  buildProductFilter,
} = require("../utils/helpers");
const { CACHE_TTL } = require("../utils/constants");

// ─── CREATE PRODUCT (Admin) ────────────────────────────────
exports.createProduct = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
  }

  const product = await Product.create(req.body);

  // Invalidate product caches
  await cacheService.invalidatePattern("products:*");

  return ApiResponse.created(res, { product }, "Product created successfully");
});

// ─── UPDATE PRODUCT (Admin) ────────────────────────────────
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  // Handle new images upload
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));

    // Append or replace based on body flag
    if (req.body.replaceImages === "true") {
      // Delete old images
      const oldPublicIds = product.images.map((img) => img.public_id);
      if (oldPublicIds.length) {
        await imageService.deleteMultipleImages(oldPublicIds);
      }
      req.body.images = newImages;
    } else {
      req.body.images = [...product.images, ...newImages];
    }
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await cacheService.invalidatePattern("products:*");

  return ApiResponse.success(res, { product }, "Product updated");
});

// ─── DELETE PRODUCT (Admin) ────────────────────────────────
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  // Delete images from Cloudinary
  const publicIds = product.images.map((img) => img.public_id);
  if (publicIds.length) {
    await imageService.deleteMultipleImages(publicIds);
  }

  await product.deleteOne();
  await cacheService.invalidatePattern("products:*");

  return ApiResponse.success(res, null, "Product deleted");
});

// ─── GET ALL PRODUCTS ──────────────────────────────────────
exports.getAllProducts = asyncHandler(async (req, res) => {
  const filter = buildProductFilter(req.query);
  const sort = buildSortQuery(req.query.sort);
  const { page, limit, skip } = buildPagination(req.query);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return ApiResponse.paginated(
    res,
    products,
    paginationMeta(total, page, limit),
    "Products fetched",
  );
});

// ─── GET SINGLE PRODUCT ───────────────────────────────────
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
    isActive: true,
  }).lean();

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  // Increment view count (non-blocking)
  Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec();

  // Fetch reviews
  const reviews = await Review.find({ product: product._id, isApproved: true })
    .populate("user", "firstName lastName avatar")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return ApiResponse.success(res, { product, reviews });
});

// ─── SEARCH PRODUCTS ──────────────────────────────────────
exports.searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest("Search query must be at least 2 characters");
  }

  const { page, limit, skip } = buildPagination(req.query);

  const products = await Product.find(
    { $text: { $search: q }, isActive: true },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Product.countDocuments({
    $text: { $search: q },
    isActive: true,
  });

  return ApiResponse.paginated(
    res,
    products,
    paginationMeta(total, page, limit),
    "Search results",
  );
});

// ─── SEARCH SUGGESTIONS (Zepto-style instant search) ───────
exports.searchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

  // If no query → return trending / popular products
  if (!q || q.trim().length === 0) {
    const trending = await cacheService.getOrSet(
      "products:trending",
      () =>
        Product.find({ isActive: true })
          .sort({ sold: -1, views: -1 })
          .limit(limit)
          .select("productName slug images price discountPrice category tags")
          .lean(),
      CACHE_TTL.PRODUCTS,
    );

    // Also return unique categories for quick filters
    const categories = await cacheService.getOrSet(
      "products:categories",
      () => Product.distinct("category", { isActive: true }),
      CACHE_TTL.PRODUCTS,
    );

    return ApiResponse.success(res, {
      products: trending,
      categories,
      type: "trending",
    });
  }

  const query = q.trim();
  if (query.length < 1) {
    return ApiResponse.success(res, {
      products: [],
      categories: [],
      type: "results",
    });
  }

  // Escape regex special chars for safe prefix matching
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  // Strategy 1: Fast regex prefix match on productName (instant as-you-type)
  let products = await Product.find({
    isActive: true,
    productName: { $regex: regex },
  })
    .sort({ sold: -1, "rating.average": -1 })
    .limit(limit)
    .select(
      "productName slug images price discountPrice category tags rating stock",
    )
    .lean();

  // Strategy 2: If regex didn't find enough, fallback to $text search (fuzzy)
  if (products.length < limit && query.length >= 2) {
    const textResults = await Product.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .select(
        "productName slug images price discountPrice category tags rating stock",
      )
      .lean();

    // Merge without duplicates
    const existingIds = new Set(products.map((p) => p._id.toString()));
    for (const tp of textResults) {
      if (!existingIds.has(tp._id.toString())) {
        products.push(tp);
        if (products.length >= limit) break;
      }
    }
  }

  // Strategy 3: Also search in tags and category
  if (products.length < limit) {
    const tagResults = await Product.find({
      isActive: true,
      $or: [
        { tags: { $regex: regex } },
        { category: { $regex: regex } },
        { material: { $regex: regex } },
      ],
    })
      .sort({ sold: -1 })
      .limit(limit)
      .select(
        "productName slug images price discountPrice category tags rating stock",
      )
      .lean();

    const existingIds = new Set(products.map((p) => p._id.toString()));
    for (const tr of tagResults) {
      if (!existingIds.has(tr._id.toString())) {
        products.push(tr);
        if (products.length >= limit) break;
      }
    }
  }

  // Extract matching categories for quick-filter chips
  const matchingCategories = [...new Set(products.map((p) => p.category))];

  return ApiResponse.success(res, {
    products,
    categories: matchingCategories,
    type: "results",
    query,
  });
});

// ─── SMART PRODUCT RECOMMENDATIONS ─────────────────────────
// Returns personalized recommendations based on a product's category,
// tags, price range, and material. Redis-cached for performance.
exports.getRecommendations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 16);

  // Try cache first
  const cacheKey = `recommendations:${id}:${limit}`;
  const recommendations = await cacheService.getOrSet(
    cacheKey,
    async () => {
      const product = await Product.findById(id)
        .select("category tags price material crochetType")
        .lean();

      if (!product) return [];

      const priceMin = product.price * 0.5;
      const priceMax = product.price * 2;

      // Score-based recommendation: same category > similar tags > price range > material
      // Strategy 1: Same category + overlapping tags (highest relevance)
      const sameCategoryProducts = await Product.find({
        _id: { $ne: id },
        isActive: true,
        category: product.category,
      })
        .sort({ sold: -1, "rating.average": -1 })
        .limit(limit * 2)
        .select(
          "productName slug images price discountPrice category tags rating stock colors material",
        )
        .lean();

      // Strategy 2: Same tags across categories
      const sameTagProducts = product.tags?.length
        ? await Product.find({
            _id: { $ne: id },
            isActive: true,
            tags: { $in: product.tags },
            category: { $ne: product.category },
          })
            .sort({ sold: -1 })
            .limit(limit)
            .select(
              "productName slug images price discountPrice category tags rating stock colors material",
            )
            .lean()
        : [];

      // Strategy 3: Similar price range + material
      const similarProducts = await Product.find({
        _id: { $ne: id },
        isActive: true,
        price: { $gte: priceMin, $lte: priceMax },
        category: { $ne: product.category },
      })
        .sort({ "rating.average": -1, sold: -1 })
        .limit(limit)
        .select(
          "productName slug images price discountPrice category tags rating stock colors material",
        )
        .lean();

      // Merge & deduplicate with scoring
      const scoreMap = new Map();

      const addWithScore = (items, baseScore) => {
        for (const item of items) {
          const idStr = item._id.toString();
          const existing = scoreMap.get(idStr);
          const tagOverlap = product.tags?.length
            ? item.tags?.filter((t) => product.tags.includes(t)).length || 0
            : 0;
          const materialOverlap = product.material?.length
            ? item.material?.filter((m) => product.material.includes(m))
                .length || 0
            : 0;
          const score = baseScore + tagOverlap * 2 + materialOverlap;

          if (!existing || existing.score < score) {
            scoreMap.set(idStr, { ...item, score });
          }
        }
      };

      addWithScore(sameCategoryProducts, 10);
      addWithScore(sameTagProducts, 5);
      addWithScore(similarProducts, 1);

      // Sort by score descending, take top N
      return Array.from(scoreMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
    CACHE_TTL.RECOMMENDATIONS,
  );

  return ApiResponse.success(res, { recommendations });
});

// ─── GET FEATURED PRODUCTS ─────────────────────────────────
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;

  const products = await cacheService.getOrSet(
    `products:featured:${limit}`,
    () =>
      Product.find({ isActive: true, isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    CACHE_TTL.PRODUCTS,
  );

  return ApiResponse.success(res, { products });
});

// ─── GET PRODUCTS BY CATEGORY ──────────────────────────────
exports.getProductsByCategory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const sort = buildSortQuery(req.query.sort);

  const filter = { category: req.params.category, isActive: true };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return ApiResponse.paginated(
    res,
    products,
    paginationMeta(total, page, limit),
  );
});

// ─── DELETE PRODUCT IMAGE ──────────────────────────────────
exports.deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const imageIndex = product.images.findIndex(
    (img) => img.public_id === req.params.imageId,
  );
  if (imageIndex === -1) {
    throw ApiError.notFound("Image not found");
  }

  await imageService.deleteImage(req.params.imageId);
  product.images.splice(imageIndex, 1);
  await product.save();

  await cacheService.invalidatePattern("products:*");

  return ApiResponse.success(res, { product }, "Image deleted");
});

// ─── ADD REVIEW ────────────────────────────────────────────
exports.addReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  // Check if user already reviewed
  const existing = await Review.findOne({
    product: req.params.id,
    user: req.user._id,
  });
  if (existing) {
    throw ApiError.conflict("You have already reviewed this product");
  }

  const review = await Review.create({
    product: req.params.id,
    user: req.user._id,
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment,
  });

  return ApiResponse.created(res, { review }, "Review added");
});

// ─── GET PRODUCT REVIEWS ───────────────────────────────────
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);

  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.id, isApproved: true })
      .populate("user", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: req.params.id, isApproved: true }),
  ]);

  return ApiResponse.paginated(
    res,
    reviews,
    paginationMeta(total, page, limit),
  );
});
