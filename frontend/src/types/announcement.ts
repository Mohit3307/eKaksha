export interface AnnouncementAuthor {
  _id: string;
  name: string;
  email?: string;
}

export interface Announcement {
  _id: string;
  course: string;
  author: AnnouncementAuthor;
  content: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}