export class CreateCommentDto {
  comment: string;
  postId: string;
  mentions?: string[];
  commentId?: string;
}
