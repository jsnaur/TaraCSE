"use client";

import { useState, useMemo, useEffect, ElementType, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MathText } from "@/components/ui/math-text";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  FileQuestion,
  Plus,
  Database,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Pencil,
  BookOpen,
  Check
} from "lucide-react";
import { Question, toggleQuestionStatus, deleteQuestion, addQuestion, updateQuestion } from "./actions";

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

// OWASP standard: Prepend a single quote to strings starting with formula triggers
const sanitizeForExport = (text: string) => {
  if (!text) return '""';
  let safeText = text.replace(/"/g, '""'); // Escape existing quotes
  if (/^[=\-+@]/.test(safeText)) {
    safeText = "'" + safeText;
  }
  return `"${safeText}"`;
};

type QuestionFormData = Omit<Question, "id" | "created_at" | "is_active">;

const defaultFormState: QuestionFormData = {
  level: "Professional",
  category: "Verbal Ability",
  difficulty: "Medium",
  question_text: "",
  options: [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false }
  ],
  explanation: ""
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionsClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [search, setSearch] = useState("");
  
  // Filters
  const [activeLevel, setActiveLevel] = useState<"All" | "Professional" | "Subprofessional">("All");
  const [activeStatus, setActiveStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("All");
  
  // Modals / Dialogs State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  
  // Add/Edit Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(defaultFormState);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Ingest State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadErrors, setUploadErrors] = useState<{ row: number; issues: string[] }[]>([]);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number; message: string } | null>(null);

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
    return questions.filter(item => {
      const matchesLevel = activeLevel === "All" || item.level === activeLevel;
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesDifficulty = activeDifficulty === "All" || item.difficulty === activeDifficulty;
      const matchesStatus = 
        activeStatus === "All" || 
        (activeStatus === "Active" && item.is_active) || 
        (activeStatus === "Inactive" && !item.is_active);
      const matchesSearch = item.question_text.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);

      return matchesLevel && matchesStatus && matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [questions, search, activeLevel, activeStatus, activeCategory, activeDifficulty]);

  // ─── Form Handlers ───
  function openAddForm() {
    setEditingId(null);
    setFormData(defaultFormState);
    setIsFormOpen(true);
  }

  function openEditForm(q: Question) {
    setEditingId(q.id);
    setFormData({
      level: q.level,
      category: q.category,
      difficulty: q.difficulty,
      question_text: q.question_text,
      options: JSON.parse(JSON.stringify(q.options)), // Deep copy
      explanation: q.explanation
    });
    setIsFormOpen(true);
  }

  async function handleSaveQuestion() {
    if (!formData.question_text || formData.options.some(o => !o.text) || !formData.explanation) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateQuestion(editingId, formData);
        toast({ title: "Question Updated", description: "Changes have been saved successfully." });
      } else {
        await addQuestion(formData);
        toast({ title: "Question Added", description: "New question added to the bank." });
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (error) {
      toast({ title: "Save Failed", description: "An error occurred while saving.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Export Handler (Secured) ───
  const handleExport = () => {
    const headers = ["ID", "Level", "Category", "Difficulty", "Question Text", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Explanation", "Status"];
    
    const rows = filtered.map(q => {
      // Map options to letters
      const letters = ['A', 'B', 'C', 'D'];
      let correctLetter = 'A';
      const optionTexts = q.options.map((opt, idx) => {
        if (opt.is_correct) correctLetter = letters[idx];
        return sanitizeForExport(opt.text);
      });

      return [
        q.id,
        q.level,
        q.category,
        q.difficulty,
        sanitizeForExport(q.question_text),
        ...optionTexts,
        correctLetter,
        sanitizeForExport(q.explanation),
        q.is_active ? "Active" : "Inactive"
      ].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taracse_export_${new Date().toISOString().split('T')[0]}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Existing Handlers ───
  async function handleToggleStatus(id: string, current: boolean) {
    try {
      await toggleQuestionStatus(id, current);
      toast({ title: "Status Updated", description: "Question visibility has been changed." });
      router.refresh();
    } catch {
      toast({ title: "Update Failed", description: "Could not update question status.", variant: "destructive" });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    try {
      await deleteQuestion(deleteId);
      toast({ title: "Question Deleted", description: "Record has been removed from the bank." });
      setDeleteId(null);
      router.refresh();
    } catch {
      toast({ title: "Delete Failed", description: "Could not remove question.", variant: "destructive" });
    }
  }

  const handleDownloadTemplate = () => {
    const headers = "level\tcategory\tdifficulty\tquestion_text\toption_a\toption_b\toption_c\toption_d\tcorrect_answer\texplanation\n";
    const blob = new Blob([headers], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taracse_ingest_template.tsv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadErrors([]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus("Validating Data...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/ingest", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setUploadErrors(data.errors);
          toast({ title: "Validation Failed", description: "Please fix the errors.", variant: "destructive" });
        } else {
          toast({ title: "Upload Error", description: data.error, variant: "destructive" });
        }
      } else {
        setUploadStatus("Finishing up...");
        setUploadResult({ inserted: data.inserted, skipped: data.skipped, message: data.message });
        toast({ title: "Ingestion Complete", description: data.message });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      }
    } catch {
      toast({ title: "Network Error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="space-y-7">
      
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-foreground">Question Bank</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and organize your interactive review content.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="rounded-xl font-bold gap-2 bg-card">
            <Download className="w-4 h-4" /> Export Filtered
          </Button>
          <Button onClick={openAddForm} className="rounded-xl font-bold bg-primary text-primary-foreground gap-2">
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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <TabsList className="h-11 rounded-2xl p-1 bg-muted/60 w-fit">
            <TabsTrigger value="list" className="rounded-xl px-6 font-bold data-[state=active]:bg-card">Manage List</TabsTrigger>
            <TabsTrigger value="ingest" className="rounded-xl px-6 font-bold data-[state=active]:bg-card">Bulk Ingest</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search text..." 
                className="pl-9 h-10 rounded-xl bg-card w-full" 
              />
            </div>
            
            <select 
              value={activeLevel}
              onChange={(e) => setActiveLevel(e.target.value as any)}
              className="h-10 rounded-xl bg-card border px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Levels</option>
              <option value="Professional">Professional</option>
              <option value="Subprofessional">Subprofessional</option>
            </select>

            <select 
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="h-10 rounded-xl bg-card border px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Categories</option>
              <option value="Verbal Ability">Verbal Ability</option>
              <option value="Numerical Ability">Numerical Ability</option>
              <option value="Analytical Ability">Analytical Ability</option>
              <option value="General Information">General Information</option>
              <option value="Clerical Operations">Clerical Operations</option>
            </select>

            <select 
              value={activeDifficulty}
              onChange={(e) => setActiveDifficulty(e.target.value)}
              className="h-10 rounded-xl bg-card border px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select 
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value as any)}
              className="h-10 rounded-xl bg-card border px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* ── List Tab ── */}
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
                    filtered.map((item) => (
                      <motion.tr 
                        key={item.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className={`border-border transition-colors group ${!item.is_active ? 'bg-muted/40 opacity-70 hover:opacity-100 hover:bg-muted/60' : 'hover:bg-muted/30'}`}
                      >
                        <TableCell className="pl-6 py-4">
                          <MathText 
                            text={item.question_text} 
                            className={`text-sm font-medium line-clamp-2 max-w-md ${!item.is_active ? 'text-muted-foreground' : 'text-foreground'}`} 
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{item.level}</p>
                            {!item.is_active && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 bg-rose-100 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400">Inactive</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg font-bold text-[10px] bg-background">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold ${!item.is_active ? 'text-muted-foreground' : item.difficulty === 'Hard' ? 'text-rose-500' : item.difficulty === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {item.difficulty}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewingQuestion(item)} title="View Details">
                              <BookOpen className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEditForm(item)} title="Edit Question">
                              <Pencil className="w-4 h-4 text-amber-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg" 
                              onClick={() => handleToggleStatus(item.id, item.is_active)}
                              title={item.is_active ? "Deactivate Question" : "Restore Question"}
                            >
                              {item.is_active ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/40" onClick={() => setDeleteId(item.id)}>
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

        {/* ── Bulk Ingest Tab ── */}
        <TabsContent value="ingest" className="m-0 space-y-6">
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border rounded-3xl p-6 md:p-8 space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black font-heading flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" /> Data Ingestion Pipeline
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Upload a 10-column TSV file. Headers: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-bold text-foreground">level, category, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation</code></p>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate} className="rounded-xl font-bold gap-2 bg-muted/50">
                <Download className="w-4 h-4" /> Sample Template
              </Button>
            </div>
            <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-colors relative ${file ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
              <input type="file" accept=".tsv,.csv,.txt" ref={fileInputRef} onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploading} />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                {file ? (
                  <><div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"><FileText className="w-8 h-8" /></div><p className="text-foreground font-bold text-lg">{file.name}</p></>
                ) : (
                  <><div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground"><UploadCloud className="w-8 h-8" /></div><p className="text-foreground font-bold text-lg">Click or drag a file to upload</p></>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleUpload} disabled={!file || isUploading} className="rounded-2xl h-12 px-8 font-bold gap-2 text-md transition-all">
                {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> {uploadStatus}</> : <><UploadCloud className="w-5 h-5" /> Start Bulk Import</>}
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ── View Details Dialog ── */}
      <Dialog open={!!viewingQuestion} onOpenChange={() => setViewingQuestion(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {viewingQuestion && (
            <>
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-background">{viewingQuestion.level}</Badge>
                  <Badge variant="secondary" className="bg-muted">{viewingQuestion.category}</Badge>
                  <Badge variant="outline" className={viewingQuestion.difficulty === 'Hard' ? 'text-rose-500' : viewingQuestion.difficulty === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}>
                    {viewingQuestion.difficulty}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-heading font-black leading-tight">
                  <MathText text={viewingQuestion.question_text} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mb-8">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingQuestion.options.map((opt, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900' : 'bg-card border-border'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${opt.is_correct ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <MathText text={opt.text} className={`text-sm ${opt.is_correct ? 'text-emerald-900 dark:text-emerald-100 font-medium' : 'text-foreground'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Explanation</h4>
                <MathText text={viewingQuestion.explanation} className="text-sm text-blue-900 dark:text-blue-100" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Sheet ── */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto custom-scrollbar p-0">
          <div className="p-6 md:p-8 space-y-8">
            <SheetHeader>
              <SheetTitle className="font-heading text-2xl font-black">
                {editingId ? "Edit Question" : "Add Single Question"}
              </SheetTitle>
              <SheetDescription>
                Fill out the details below. Ensure one option is marked as correct.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Metadata row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Level</label>
                  <select 
                    value={formData.level} 
                    onChange={e => setFormData({...formData, level: e.target.value as any})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Subprofessional">Subprofessional</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Verbal Ability">Verbal</option>
                    <option value="Numerical Ability">Numerical</option>
                    <option value="Analytical Ability">Analytical</option>
                    <option value="General Information">Gen Info</option>
                    <option value="Clerical Operations">Clerical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Difficulty</label>
                  <select 
                    value={formData.difficulty} 
                    onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Question Text</label>
                <textarea 
                  value={formData.question_text}
                  onChange={e => setFormData({...formData, question_text: e.target.value})}
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Enter the main question text here..."
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-muted-foreground">Options & Correct Answer</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${opt.is_correct ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border bg-card'}`}>
                    <button 
                      type="button"
                      onClick={() => {
                        const newOpts = formData.options.map((o, i) => ({ ...o, is_correct: i === idx }));
                        setFormData({...formData, options: newOpts});
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${opt.is_correct ? 'bg-emerald-500 text-white' : 'bg-muted hover:bg-muted-foreground/20'}`}
                    >
                      {opt.is_correct ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>}
                    </button>
                    <Input 
                      value={opt.text}
                      onChange={e => {
                        const newOpts = [...formData.options];
                        newOpts[idx].text = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                      className="border-none shadow-none focus-visible:ring-0 bg-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Explanation</label>
                <textarea 
                  value={formData.explanation}
                  onChange={e => setFormData({...formData, explanation: e.target.value})}
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Explain why the answer is correct..."
                />
              </div>
            </div>

            <SheetFooter className="pt-6">
              <Button variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleSaveQuestion} disabled={isSaving} className="rounded-xl font-bold w-full sm:w-auto bg-primary">
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "Save Changes" : "Create Question"}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

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