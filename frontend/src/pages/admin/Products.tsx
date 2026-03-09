import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Pencil, Trash2, Search, X, Upload } from "lucide-react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types";

const CATEGORIES = [
  { label: "Amigurumi", value: "amigurumi" },
  { label: "Clothing", value: "clothing" },
  { label: "Accessories", value: "accessories" },
  { label: "Home Decor", value: "home-decor" },
  { label: "Bags", value: "bags" },
  { label: "Toys", value: "toys" },
  { label: "Baby Items", value: "baby-items" },
  { label: "Jewelry", value: "jewelry" },
  { label: "Gifts", value: "gifts" },
  { label: "Seasonal", value: "seasonal" },
  { label: "Other", value: "other" },
];

const CROCHET_TYPES = [
  { label: "Single Crochet", value: "single-crochet" },
  { label: "Double Crochet", value: "double-crochet" },
  { label: "Granny Square", value: "granny-square" },
  { label: "Tunisian", value: "tunisian" },
  { label: "Tapestry", value: "tapestry" },
  { label: "Filet", value: "filet" },
  { label: "Amigurumi", value: "amigurumi" },
  { label: "Freeform", value: "freeform" },
  { label: "Irish Crochet", value: "irish-crochet" },
  { label: "Broomstick Lace", value: "broomstick-lace" },
  { label: "Other", value: "other" },
];

const AdminProducts = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useProducts({ page, limit: 12, search });
  const products = (data?.data as Product[]) || [];
  const pagination = data?.pagination;

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const openCreate = () => {
    setEditProduct(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Handle tags as comma-separated → array
    const tagsStr = formData.get("tags") as string;
    formData.delete("tags");
    if (tagsStr) {
      tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => formData.append("tags", t));
    }

    // Handle colors as comma-separated → array
    const colorsStr = formData.get("colors") as string;
    formData.delete("colors");
    if (colorsStr) {
      colorsStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => formData.append("colors", c));
    }

    // Handle material as comma-separated → array
    const materialStr = formData.get("material") as string;
    formData.delete("material");
    if (materialStr) {
      materialStr
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
        .forEach((m) => formData.append("material", m));
    }

    // Handle checkboxes - convert "on" to true, remove if unchecked
    const isFeatured = form.querySelector<HTMLInputElement>(
      'input[name="isFeatured"]',
    );
    formData.delete("isFeatured");
    if (isFeatured?.checked) {
      formData.append("isFeatured", "true");
    }

    const isBestSeller = form.querySelector<HTMLInputElement>(
      'input[name="isBestSeller"]',
    );
    formData.delete("isBestSeller");
    if (isBestSeller?.checked) {
      formData.append("isBestSeller", "true");
    }

    try {
      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct._id, formData });
        toast({ title: "Product updated" });
      } else {
        await createProduct.mutateAsync(formData);
        toast({ title: "Product created" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Error saving product", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteProduct.mutateAsync(deleteConfirmId);
      toast({ title: "Product deleted" });
      setDeleteConfirmId(null);
    } catch {
      toast({ title: "Error deleting product", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl text-foreground"
        >
          Products
        </motion.h1>
        <Button
          onClick={openCreate}
          className="bg-warm-brown hover:bg-warm-brown/90 rounded-xl"
        >
          <Plus size={16} className="mr-1" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9 rounded-xl font-body"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-warm-brown" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-10">
          No products found
        </p>
      ) : (
        <>
          <div className="overflow-x-auto bg-card rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Stock
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-body text-sm font-medium line-clamp-1">
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground capitalize">
                      {product.category}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-right">
                      ₹{product.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-right">
                      <span
                        className={
                          product.stock < 5 ? "text-red-500 font-medium" : ""
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(product)}
                          className="h-8 w-8 rounded-lg"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(product._id)}
                          className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg font-body text-sm"
              >
                Previous
              </Button>
              <span className="text-sm font-body text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="rounded-lg font-body text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editProduct ? "Edit Product" : "Create Product"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            encType="multipart/form-data"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Name *
                </label>
                <Input
                  name="productName"
                  defaultValue={editProduct?.productName || ""}
                  required
                  className="mt-1 rounded-xl font-body"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Category *
                </label>
                <Select
                  name="category"
                  defaultValue={editProduct?.category || ""}
                >
                  <SelectTrigger className="mt-1 rounded-xl font-body">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Crochet Type *
                </label>
                <Select
                  name="crochetType"
                  defaultValue={editProduct?.crochetType || ""}
                >
                  <SelectTrigger className="mt-1 rounded-xl font-body">
                    <SelectValue placeholder="Select crochet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROCHET_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Handmade Time *
                </label>
                <Input
                  name="handmadeTime"
                  defaultValue={editProduct?.handmadeTime || ""}
                  required
                  className="mt-1 rounded-xl font-body"
                  placeholder="e.g. 3-4 hours"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-body font-medium text-foreground">
                Description *
              </label>
              <Textarea
                name="description"
                defaultValue={editProduct?.description || ""}
                required
                className="mt-1 rounded-xl font-body"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Price (₹) *
                </label>
                <Input
                  name="price"
                  type="number"
                  defaultValue={editProduct?.price || ""}
                  required
                  className="mt-1 rounded-xl font-body"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Discount Price
                </label>
                <Input
                  name="discountPrice"
                  type="number"
                  defaultValue={editProduct?.discountPrice || ""}
                  className="mt-1 rounded-xl font-body"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Stock *
                </label>
                <Input
                  name="stock"
                  type="number"
                  defaultValue={editProduct?.stock ?? ""}
                  required
                  className="mt-1 rounded-xl font-body"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Material (comma-separated) *
                </label>
                <Input
                  name="material"
                  defaultValue={editProduct?.material?.join(", ") || ""}
                  required
                  className="mt-1 rounded-xl font-body"
                  placeholder="Cotton, Acrylic yarn"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Care Instructions
                </label>
                <Input
                  name="careInstructions"
                  defaultValue={editProduct?.careInstructions || ""}
                  className="mt-1 rounded-xl font-body"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Colors (comma-separated) *
                </label>
                <Input
                  name="colors"
                  defaultValue={editProduct?.colors?.join(", ") || ""}
                  required
                  className="mt-1 rounded-xl font-body"
                  placeholder="Pink, Sage, Cream"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Tags (comma-separated)
                </label>
                <Input
                  name="tags"
                  defaultValue={editProduct?.tags?.join(", ") || ""}
                  className="mt-1 rounded-xl font-body"
                  placeholder="crochet, handmade"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={editProduct?.isFeatured}
                  className="rounded"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input
                  type="checkbox"
                  name="isBestSeller"
                  defaultChecked={editProduct?.isBestSeller}
                  className="rounded"
                />
                Best Seller
              </label>
            </div>

            {!editProduct && (
              <div>
                <label className="text-sm font-body font-medium text-foreground">
                  Images
                </label>
                <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <Upload
                    size={24}
                    className="mx-auto mb-2 text-muted-foreground"
                  />
                  <Input
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="font-body"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl font-body"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
                className="bg-warm-brown hover:bg-warm-brown/90 rounded-xl font-body"
              >
                {(createProduct.isPending || updateProduct.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                {editProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Delete Product
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-body text-muted-foreground">
            Are you sure you want to delete this product? This action cannot be
            undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl font-body"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-body"
            >
              {deleteProduct.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
