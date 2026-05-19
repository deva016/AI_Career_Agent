"use client";

import { motion } from "framer-motion";
import { Share2, Sparkles, Send, Calendar, Wand2, User, Globe, ThumbsUp, MessageSquare, Repeat2, Send as SendIcon, Zap, History, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  DashboardHeader,
  PageSkeleton,
  EmptyState,
} from "@/components/dashboard";
import { useLinkedIn } from "@/lib/hooks/use-linkedin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 6;

export default function LinkedInPage() {
  const [offset, setOffset] = useState(0);
  const { posts, total, loading, error, generatePost, publishPost } = useLinkedIn({ limit: ITEMS_PER_PAGE, offset });
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastGeneratedPostId, setLastGeneratedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const { toast } = useToast();

  const handleNext = () => {
    if (offset + ITEMS_PER_PAGE < total) {
      setOffset(prev => prev + ITEMS_PER_PAGE);
    }
  };

  const handlePrev = () => {
    if (offset - ITEMS_PER_PAGE >= 0) {
      setOffset(prev => prev - ITEMS_PER_PAGE);
    }
  };

  const handleGenerate = async () => {
    if (!topic) {
      toast({ title: "Topic Required", description: "Please enter a topic for the post.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const result = await generatePost(topic, context || "Professional career growth context.");
      const generatedContent = result.content || result.post?.content || result.draft || "";
      if (generatedContent) {
        setContent(generatedContent);
        setLastGeneratedPostId(result.id);
        toast({ title: "Post Generated! ✨", description: "AI has crafted a narrative for you." });
      } else {
        toast({ title: "Generation Issue", description: "Post was saved but content is empty. Check the backend logs.", variant: "destructive" });
      }
    } catch (err) {
      toast({ 
        title: "Generation Failed", 
        description: err instanceof Error ? err.message : "Error", 
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (isScheduled: boolean = false) => {
    if (!content) {
      toast({ title: "Content Required", description: "Please write or generate some content first.", variant: "destructive" });
      return;
    }

    if (!lastGeneratedPostId) {
      toast({ title: "Save Draft First", description: "Please save or generate the post content before publishing.", variant: "destructive" });
      return;
    }
    
    try {
      await publishPost(lastGeneratedPostId, content, isScheduled ? new Date(Date.now() + 86400000) : undefined);
      toast({ 
        title: isScheduled ? "Post Scheduled! 📅" : "Post Published! 🚀", 
        description: isScheduled ? "Your post is queued for tomorrow." : "Your professional update is live." 
      });
    } catch (err) {
      toast({ title: "Action Failed", description: "Could not sync with LinkedIn service.", variant: "destructive" });
    }
  };

  if (loading && posts.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <DashboardHeader
        title="LinkedIn Studio"
        description="Craft high-engagement narratives for your professional network"
        action={{
          label: generating ? "Writing..." : "AI Generate",
          icon: Sparkles,
          onClick: handleGenerate,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
        {/* Left Column: Editor & Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           <Card className="flex-1 bg-white/5 border-white/10 flex flex-col overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <Zap className="w-32 h-32" />
              </div>
               <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                     <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">Post Studio</span>
                     </div>
                     <div className="flex gap-2">
                        {['Professional', 'Bold', 'Narrative'].map(tone => (
                          <Badge key={tone} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/20 border-white/10 text-muted-foreground hover:text-primary transition-colors">
                            {tone}
                          </Badge>
                        ))}
                     </div>
                  </div>
                  {/* AI Input Fields */}
                  <div className="px-6 pt-4 pb-3 border-b border-white/5 space-y-3">
                     <div>
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Topic *</label>
                        <input
                           className="w-full mt-1 bg-transparent border-b border-white/10 focus:border-primary/50 text-sm text-white focus:outline-none py-1 placeholder:text-muted-foreground/30 transition-colors"
                           placeholder="e.g. My journey into Cloud Native architecture"
                           value={topic}
                           onChange={(e) => setTopic(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Additional Context (optional)</label>
                        <input
                           className="w-full mt-1 bg-transparent border-b border-white/10 focus:border-primary/50 text-sm text-white focus:outline-none py-1 placeholder:text-muted-foreground/30 transition-colors"
                           placeholder="e.g. Mention the AWS certification I just passed"
                           value={context}
                           onChange={(e) => setContext(e.target.value)}
                        />
                     </div>
                  </div>
                  <textarea 
                     className="flex-1 p-6 bg-transparent border-none focus:ring-0 text-foreground resize-none font-sans leading-relaxed text-sm placeholder:text-muted-foreground/30 focus:outline-none"
                     placeholder="Capture your professional thoughts or let AI generate a post from your recent wins..."
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="p-4 border-t border-white/5 bg-white/5 flex items-center justify-between">
                     <span className="text-[10px] text-muted-foreground font-medium">
                        {content.length} / 3000 characters
                     </span>
                     <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] hover:bg-white/5">Save Draft</Button>
                        <Button size="sm" className="h-8 text-[10px] bg-primary hover:bg-primary/90">Preview Mode</Button>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <div className="flex gap-4">
               <Button
                  onClick={() => handlePublish(true)}
                  className="flex-1 h-12 bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
               >
                  <Calendar className="w-4 h-4" />
                  Schedule Publication
               </Button>
               <Button
                  onClick={() => handlePublish(false)}
                  variant="outline"
                  className="h-12 px-6 border-white/10 hover:bg-white/5 gap-2"
               >
                  <Send className="w-4 h-4" />
                  Post Now
               </Button>
            </div>
        </div>

        {/* Right Column: LinkedIn Preview */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Live Preview</h3>
           
           <Card className="bg-black border border-white/10 rounded-lg shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="p-5">
                 {/* LinkedIn Header */}
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                       <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                       <div className="flex items-center gap-1">
                          <h4 className="font-bold text-white text-[14px] hover:text-primary transition-colors cursor-pointer">Your Professional Name</h4>
                          <span className="text-muted-foreground text-[12px]">• 1st</span>
                       </div>
                       <p className="text-[12px] text-muted-foreground leading-none mb-1">Software Engineer | AI & Automation Enthusiast</p>
                       <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span>1m</span>
                          <span>•</span>
                          <Globe className="w-3 h-3" />
                       </div>
                    </div>
                 </div>

                 {/* Post Content */}
                 <div className="text-[14px] text-gray-200 whitespace-pre-wrap leading-relaxed min-h-[100px] mb-6">
                    {content || "Your amazing LinkedIn post will look like this. Start typing in the editor or use AI Generate to get started..."}
                 </div>

                 <Separator className="bg-white/5 mb-4" />

                 {/* Actions */}
                 <div className="flex items-center justify-around">
                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors flex-1 opacity-60 hover:opacity-100">
                       <ThumbsUp className="w-4 h-4" />
                       <span className="text-[10px] font-bold">Like</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors flex-1 opacity-60 hover:opacity-100">
                       <MessageSquare className="w-4 h-4" />
                       <span className="text-[10px] font-bold">Comment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors flex-1 opacity-60 hover:opacity-100">
                       <Repeat2 className="w-4 h-4" />
                       <span className="text-[10px] font-bold">Repost</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors flex-1 opacity-60 hover:opacity-100">
                       <SendIcon className="w-4 h-4" />
                       <span className="text-[10px] font-bold">Send</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                 </div>
                 <h4 className="text-sm font-bold text-white">Engagement AI</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                 AI predicts high engagement for this post's structure. Recommended hashtags: #AI #CareerGrowth #Automation.
              </p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
               <History className="w-4 h-4 text-primary" />
               Post History
            </h3>
            {total > 0 && (
               <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {offset + 1}-{Math.min(offset + ITEMS_PER_PAGE, total)} of {total}
                  </span>
                  <div className="flex gap-1">
                     <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 border-white/10 hover:bg-white/10"
                        onClick={handlePrev}
                        disabled={offset === 0}
                     >
                        <ChevronLeft className="w-3 h-3" />
                     </Button>
                     <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 border-white/10 hover:bg-white/10"
                        onClick={handleNext}
                        disabled={offset + ITEMS_PER_PAGE >= total}
                     >
                        <ChevronRight className="w-3 h-3" />
                     </Button>
                  </div>
               </div>
            )}
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.length > 0 ? (
               posts.map((post) => (
                  <Card key={post.id} className="bg-white/5 border-white/5 hover:border-primary/30 transition-colors group cursor-pointer">
                     <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                           <Badge variant="outline" className={`text-[9px] uppercase ${
                              post.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              post.status === 'scheduled' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-white/5 text-muted-foreground border-white/10'
                           }`}>
                              {post.status}
                           </Badge>
                           <span className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed group-hover:text-gray-300 transition-colors">
                           {post.content}
                        </p>
                     </CardContent>
                  </Card>
               ))
            ) : (
               <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-white/5 bg-white/5">
                  <p className="text-sm text-muted-foreground">No draft history yet. Start creating!</p>
               </div>
            )}
         </div>
      </div>
    </motion.div>
  );
}
