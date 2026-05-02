/** Variant option from Wix (e.g. Flavours dropdown / colour swatches). */
export interface CatalogVariantChoice {
  label: string
  swatch?: string
}

export interface CatalogVariant {
  name: string
  type: string
  choices: CatalogVariantChoice[]
}

/** Public product shape returned by `/api/products` and used in the shop UI. */
export interface CatalogProduct {
  id: string
  name: string
  descriptionHtml: string
  descriptionPlain: string
  images: string[]
  image: string
  primaryCategory: string
  categories: string[]
  price: number
  compareAtPrice: number | null
  badge: string | null
  inStock: boolean
  variants: CatalogVariant[]
  sku: string | null
  brand: string | null
  accentColor: string
}
