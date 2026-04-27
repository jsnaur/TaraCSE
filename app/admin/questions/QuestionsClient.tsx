"use client";

import { useState, useMemo, useEffect, ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  FileQuestion,
  Plus,
  Database,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Question, toggleQuestionStatus, deleteQuestion, addQuestion } from "./actions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, colorClass, delay }: { label: string; value: number; icon: ElementType; colorClass: string; delay: number; }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-heading font-black text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionsClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [search, setSearch] = useState("");
  const [activeLevel, setActiveLevel] = useState<"All" | "Professional" | "Subprofessional">("All");
  
  // Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const stats = useMemo(() => ({
    total: questions.length,
    active: questions.filter(q => q.is_active).length,
    prof: questions.filter(q => q.level === "Professional").length,
    subprof: questions.filter(q => q.level === "Subprofessional").length,
  }), [questions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return questions.filter(item => 
      (activeLevel === "All" || item.level === activeLevel) &&
      (item.question_text.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    );
  }, [questions, search, activeLevel]);

  async function handleToggleStatus(id: string, current: boolean) {
    try {
      await toggleQuestionStatus(id, current);
      toast({ title: "Status Updated", description: "Question visibility has been changed." });
    } catch {
      toast({ title: "Update Failed", description: "Could not update question status." });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    try {
      await deleteQuestion(deleteId);
      toast({ title: "Question Deleted", description: "Record has been removed from the bank." });
      setDeleteId(null);
    } catch {
      toast({ title: "Delete Failed", description: "Could not remove question." });
    }
  }

  return (
    <div className="space-y-7">
      
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-foreground">Question Bank</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and organize your interactive review content.</p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-xl font-bold bg-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Add Single
          </Button>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Items" value={stats.total} icon={FileQuestion} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40" delay={0.05} />
        <StatCard label="Active Items" value={stats.active} icon={Sparkles} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40" delay={0.1} />
        <StatCard label="Professional" value={stats.prof} icon={Database} colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/40" delay={0.15} />
        <StatCard label="Subprofessional" value={stats.subprof} icon={Database} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40" delay={0.2} />
      </div>

      {/* ── Main View ── */}
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="h-11 rounded-2xl p-1 bg-muted/60">
            <TabsTrigger value="list" className="rounded-xl px-6 font-bold data-[state=active]:bg-card">Manage List</TabsTrigger>
            <TabsTrigger value="ingest" className="rounded-xl px-6 font-bold data-[state=active]:bg-card">Bulk Ingest</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..." 
                className="pl-9 h-10 rounded-xl bg-card" 
              />
            </div>
            <select 
              value={activeLevel}
              onChange={(e) => setActiveLevel(e.target.value as any)}
              className="h-10 rounded-xl bg-card border px-3 text-sm font-medium focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Levels</option>
              <option value="Professional">Professional</option>
              <option value="Subprofessional">Subprofessional</option>
            </select>
          </div>
        </div>

        <TabsContent value="list" className="m-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30">
                  <TableHead className="pl-6 w-[40%]"><span className="text-xs font-bold uppercase tracking-wider">Question Text</span></TableHead>
                  <TableHead><span className="text-xs font-bold uppercase tracking-wider">Category</span></TableHead>
                  <TableHead><span className="text-xs font-bold uppercase tracking-wider">Difficulty</span></TableHead>
                  <TableHead className="text-right pr-6"><span className="text-xs font-bold uppercase tracking-wider">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No questions found matching your criteria.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item, i) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-border hover:bg-muted/30 group transition-colors">
                        <TableCell className="pl-6 py-4">
                          <p className="text-sm font-medium text-foreground line-clamp-2 max-w-md">{item.question_text}</p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">{item.level}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg font-bold text-[10px] bg-background">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold ${item.difficulty === 'Hard' ? 'text-rose-500' : item.difficulty === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {item.difficulty}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleToggleStatus(item.id, item.is_active)}>
                              {item.is_active ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-100 hover:text-rose-600" onClick={() => setDeleteId(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        <TabsContent value="ingest" className="m-0">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-dashed border-primary/30 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black font-heading">Bulk Data Ingestion</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Paste your TSV formatted data here to insert hundreds of questions at once. 
              Ensure headers match: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-bold">level	category	difficulty...</code>
            </p>
            <div className="flex justify-center pt-4">
              <Button variant="outline" className="rounded-2xl h-12 px-8 font-bold border-2 gap-2" onClick={() => window.open('/api/admin/ingest', '_blank')}>
                Access Ingest Route <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-border max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading font-black">Permanent Delete?</AlertDialogTitle>
            <AlertDialogDescription>This question will be removed from all future exams. Users who have already answered it will keep their history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}