import {
  Comment,
  CommentCursor,
  GroupID,
  Post,
  PostID,
  Range,
} from "@connect/api-client";
import {Context} from "../Context";
import {PGPagination} from "../PGPagination";
import {sql} from "../PGSQL";

/**
 * Get a single post from our database.
 */
export async function getPost(
  ctx: Context,
  input: {readonly id: PostID},
): Promise<{readonly post: Post | null}> {
  const postID = input.id;
  const {
    rows: [row],
  } = await ctx.query(
    sql`SELECT group_id, author_id, published_at, content FROM post WHERE id = ${postID}`,
  );
  if (row === undefined) {
    return {post: null};
  } else {
    const post: Post = {
      id: input.id,
      groupID: row.group_id,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    };
    return {post};
  }
}

// Create a paginator for comments.
const PGPaginationComment = new PGPagination(sql`comment`, [
  {column: sql`posted_at`},
  {column: sql`id`},
]);

/**
 * Get the comments for a post.
 */
export async function getPostComments(
  ctx: Context,
  input: {readonly postID: PostID} & Range<CommentCursor>,
): Promise<{
  readonly comments: ReadonlyArray<Comment>;
}> {
  // Get a list of comments in chronological order using the pagination
  // parameters provided by our input.
  const {rows} = await PGPaginationComment.query(ctx, {
    selection: sql`id, author_id, posted_at, content`,
    extraCondition: sql`post_id = ${sql.value(input.postID)}`,
    range: input,
  });

  const comments = rows.map(
    (row): Comment => ({
      id: row.id,
      postID: input.postID,
      authorID: row.author_id,
      postedAt: row.posted_at,
      content: row.content,
    }),
  );

  return {comments};
}

/**
 * Publishes a new post.
 */
export async function publishPost(
  ctx: Context,
  input: {readonly groupID: GroupID; readonly content: string},
): Promise<{
  readonly postID: PostID;
}> {
  const {accountID} = ctx;
  const {groupID, content} = input;

  const {
    rows: [row],
  } = await ctx.query(
    sql`INSERT INTO post (group_id, author_id, content) VALUES (${groupID}, ${accountID}, ${content}) RETURNING id`,
  );

  return {
    postID: row.id,
  };
}
