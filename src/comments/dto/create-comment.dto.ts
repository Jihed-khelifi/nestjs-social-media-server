export class CreateCommentDto {
  _id?: string;
  comment: string;
  postId: string;
  mentions?: string[];
  commentId?: string;
}
