export type Primitive = string | number | boolean | null

export type TranslationValue =
  | Primitive
  | TranslationValue[]
  | {
      [key: string]: TranslationValue
    }

export type NestedDictionary = {
  [key: string]: TranslationValue
}

export type TranslationKey = string
