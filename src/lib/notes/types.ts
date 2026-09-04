export type PersonalNote = {
  id: string;
  userId: string;
  title: string;
  body: string;
  /** Calendar day (YYYY-MM-DD) the note appears on. */
  notedOn: string;
  createdAt: string;
  updatedAt: string;
};
