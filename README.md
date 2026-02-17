* Problems I faced and how did I solved them:-

- Real-time updates not working on Vercel: Bookmarks weren't updating across tabs without page reload when deployed.Added manual fetchBookmarks() calls after add/delete operations as a fallback and configured Supabase Realtime properly by enabling replication on the bookmarks table.

-  WebSocket authentication failures: Got "HTTP Authentication failed" errors for WebSocket connections. Fixed by adding trim()to environment variables to remove trailing newlines/whitespace that were breaking the API key, and ensured Vercel environment variables were set correctly without extra characters.

-  Add bookmark button not working: The supabase.auth.getUser() call was timing out on Vercel's serverless environment. Initially tried switching togetSession() but ultimately kept getUser() and added proper error handling plus manual UI refresh calls to ensure bookmarks appear immediately regardless of async issues.

-  UI not updating after operations: Changes only appeared after page reload.Solved by calling await fetchBookmarks() immediately after successful insert/delete operations,ensuring instant UI feedback without relying solely on real-time subscriptions. 