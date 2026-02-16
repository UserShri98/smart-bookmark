"use client";

import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {useRouter} from "next/navigation";

export default function Dashboard(){
  const router=useRouter();

  const [bookmarks,setBookmarks]=useState([]);
  const [title,setTitle]=useState("");
  const [url,setUrl]=useState("");

useEffect(()=>{
  let channel;

  const setup=async()=>{
    const {data}=await supabase.auth.getSession();

    if(!data.session){
      router.push("/");
      return;
    }

    await fetchBookmarks();

    channel=supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        {
          event:"*",
          schema:"public",
          table:"bookmarks",
        },
        (payload)=>{
          console.log("Realtime event:", payload);
          fetchBookmarks();
        }
      )
      .subscribe((status)=>{
        console.log("Subscription status:",status);
      });
  };

  setup();

  return ()=>{
    if(channel){
      supabase.removeChannel(channel);
    }
  };
}, [router]);


  const checkUser=async()=>{
    const {data}=await supabase.auth.getSession();
    if(!data.session){
      router.push("/");
    }
  };

  const fetchBookmarks=async ()=>{
    const {data,error}=await supabase
      .from("bookmarks")
       .select("*")
      .order("created_at", { ascending: false });

    if(!error){
      setBookmarks(data);
    }
  };

  const addBookmark=async()=>{
    if(!title.trim() || !url.trim()) return;

    const {
      data:{user},
    }=await supabase.auth.getUser();

    const{error}=await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ]);

    if(!error){
      setTitle("");
      setUrl("");
    }else{
      console.error(error);
    }
  };

  const deleteBookmark=async(id)=>{
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const subscribeToChanges=()=>{
    supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        {event:"*",schema:"public",table:"bookmarks"},
        ()=>{
          fetchBookmarks();
        }
      )
      .subscribe();
  };

  const logout=async()=>{
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              My Bookmarks
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Save and organize your favorite links
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 text-sm font-medium text-red-600 hover:text-white border-2 border-red-600 hover:bg-red-600 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            Logout
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Add New Bookmark
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={addBookmark}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Add
            </button>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No bookmarks yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start adding your favorite links above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark, index) => (
              <div
                key={bookmark.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300 hover:scale-[1.02] animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                        {bookmark.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <span className="truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
                          {bookmark.url}
                        </span>
                      </div>
                    </a>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 group-hover:scale-110"
                    title="Delete bookmark"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}