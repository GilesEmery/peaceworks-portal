export type ContentItemKind = "monthly_question" | "resource" | "training";

export type ContentItemRow = {
  id: string;
  content_kind: ContentItemKind;
  created_at: string;
  updated_at: string;
};
