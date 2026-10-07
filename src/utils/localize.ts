import { Category, Brand, Product } from "../types";

/**
 * Helper to get localized category name with fallback to Arabic name
 */
export function getCategoryName(category: Category, lang: string): string {
  if (lang === "en" && category.name_en && category.name_en.trim() !== "") {
    return category.name_en;
  }
  return category.name;
}

/**
 * Helper to get localized category description with fallback to Arabic description
 */
export function getCategoryDescription(category: Category, lang: string): string {
  if (lang === "en" && category.description_en && category.description_en.trim() !== "") {
    return category.description_en;
  }
  return category.description || "";
}

/**
 * Helper to get localized brand name with fallback to Arabic name
 */
export function getBrandName(brand: Brand, lang: string): string {
  if (lang === "en" && brand.name_en && brand.name_en.trim() !== "") {
    return brand.name_en;
  }
  return brand.name;
}

/**
 * Helper to get localized product name with fallback to Arabic name
 */
export function getProductName(product: Product, lang: string): string {
  if (lang === "en" && product.name_en && product.name_en.trim() !== "") {
    return product.name_en;
  }
  return product.name;
}

/**
 * Helper to get localized product short description with fallback to Arabic
 */
export function getProductShortDescription(product: Product, lang: string): string {
  if (lang === "en" && product.short_description_en && product.short_description_en.trim() !== "") {
    return product.short_description_en;
  }
  return product.short_description || "";
}

/**
 * Helper to get localized product full description with fallback to Arabic
 */
export function getProductFullDescription(product: Product, lang: string): string {
  if (lang === "en" && product.full_description_en && product.full_description_en.trim() !== "") {
    return product.full_description_en;
  }
  return product.full_description || "";
}

/**
 * Helper to get localized product specs with fallback to Arabic specs for missing keys
 */
export function getProductSpecs(product: Product, lang: string): Record<string, string> {
  const arabicSpecs = product.specs || {};
  if (lang === "en" && product.specs_en && Object.keys(product.specs_en).length > 0) {
    // Merge: if an English spec key is missing or empty, fall back to Arabic key/val
    const mergedSpecs: Record<string, string> = {};
    const englishSpecs = product.specs_en;
    
    // Iterate over English specs or Arabic specs
    Object.keys(englishSpecs).forEach((key) => {
      const val = englishSpecs[key];
      if (val && val.trim() !== "") {
        mergedSpecs[key] = val;
      }
    });

    // If English specs has keys, return them, else fallback to Arabic specs
    if (Object.keys(mergedSpecs).length > 0) {
      return mergedSpecs;
    }
  }
  return arabicSpecs;
}

/**
 * Helper to get localized product features with fallback to Arabic features
 */
export function getProductFeatures(product: Product, lang: string): string[] {
  const arabicFeatures = product.features || [];
  if (lang === "en" && product.features_en && product.features_en.length > 0) {
    const validEn = product.features_en.filter((f) => f && f.trim() !== "");
    if (validEn.length > 0) {
      return validEn;
    }
  }
  return arabicFeatures;
}

