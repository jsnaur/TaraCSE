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
  FileText
} from "lucide-react";
import { Question, toggleQuestionStatus, deleteQuestion } from "./actions";

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
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [search, setSearch] = useState("");
  const [activeLevel, setActiveLevel] = useState<"All" | "Professional" | "Subprofessional">("All");
  
  // NEW: Status filter state
  const [activeStatus, setActiveStatus] = useState<"All" | "Active" | "Inactive">("All");
  
  // Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      // Check Level Match
      const matchesLevel = activeLevel === "All" || item.level === activeLevel;
      
      // Check Status Match
      const matchesStatus = 
        activeStatus === "All" || 
        (activeStatus === "Active" && item.is_active) || 
        (activeStatus === "Inactive" && !item.is_active);
      
      // Check Search Match
      const matchesSearch = item.question_text.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);

      return matchesLevel && matchesStatus && matchesSearch;
    });
  }, [questions, search, activeLevel, activeStatus]);

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

  // ─── Bulk Ingest Handlers ───
  const handleDownloadTemplate = () => {
    const headers = "level\tcategory\tdifficulty\tquestion_text\toption_a\toption_b\toption_c\toption_d\tcorrect_answer\texplanation\n";
    const sample1 = "Professional\tNumerical Ability\tMedium\tA store's daily foot traffic from Monday to Friday was: 120, 145, 130, 160, 180. On which day did the foot traffic decrease?\tWednesday\tTuesday\tThursday\tFriday\tA\tWednesday's traffic of 130 is lower than Tuesday's traffic of 145.\n";
    const sample2 = "Professional\tVerbal Ability\tEasy\tWhich of the following words is NOT a palindrome?\tkayak\tradar\tcustom\tmadam\tC\tA palindrome reads the same forwards and backwards; the word 'custom' does not.\n";
    
    const blob = new Blob([headers + sample1 + sample2], { type: 'text/tab-separated-values' });
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
    setUploadErrors([]);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Small artificial delay to show UI state if processing is too fast
      await new Promise(resolve => setTimeout(resolve, 600)); 
      
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setUploadErrors(data.errors);
          toast({ title: "Validation Failed", description: "Please fix the errors in your file and try again.", variant: "destructive" });
        } else {
          toast({ title: "Upload Error", description: data.error || "An unexpected error occurred.", variant: "destructive" });
        }
      } else {
        setUploadStatus("Finishing up...");
        setUploadResult({ inserted: data.inserted, skipped: data.skipped, message: data.message });
        toast({ title: "Ingestion Complete", description: data.message });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Refresh server data to populate the datatable
        router.refresh();
      }
    } catch (error) {
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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <TabsList className="h-11 rounded-2xl p-1 bg-muted/60 w-fit">
            <TabsTrigger value="list" className="rounded-xl px-6 font-bold data-[state=active]:bg-card">Manage List</TabsTrigger>
            <TabsTrigger value="ingest" className="rounded-xl px-6 font-bold data-[state=active]:bg-card">Bulk Ingest</TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..." 
                className="pl-9 h-10 rounded-xl bg-card w-full" 
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={activeLevel}
                onChange={(e) => setActiveLevel(e.target.value as any)}
                className="h-10 rounded-xl bg-card border px-3 text-sm font-medium focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring flex-1 sm:flex-none"
              >
                <option value="All">All Levels</option>
                <option value="Professional">Professional</option>
                <option value="Subprofessional">Subprofessional</option>
              </select>

              {/* NEW: Status Select Filter */}
              <select 
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value as any)}
                className="h-10 rounded-xl bg-card border px-3 text-sm font-medium focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring flex-1 sm:flex-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
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

            {/* File Dropzone / Selector */}
            <div 
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-colors relative ${file ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}
            >
              <input 
                type="file" 
                accept=".tsv,.csv,.txt"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                {file ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-foreground font-bold text-lg">{file.name}</p>
                    <p className="text-muted-foreground text-sm">{(file.size / 1024).toFixed(2)} KB • Click to change file</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-foreground font-bold text-lg">Click or drag a file to upload</p>
                    <p className="text-muted-foreground text-sm">Supports .tsv files up to 5MB.</p>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading} 
                className="rounded-2xl h-12 px-8 font-bold gap-2 text-md transition-all"
              >
                {isUploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {uploadStatus}</>
                ) : (
                  <><UploadCloud className="w-5 h-5" /> Start Bulk Import</>
                )}
              </Button>
            </div>

            {/* Error Reporting Area */}
            <AnimatePresence>
              {uploadErrors.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl p-6 overflow-hidden"
                >
                  <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
                    <AlertCircle className="w-6 h-6" />
                    <h4 className="font-bold text-lg font-heading">Validation Failed ({uploadErrors.length} rows with issues)</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                    {uploadErrors.map((err, idx) => (
                      <div key={idx} className="bg-white dark:bg-background border border-rose-100 dark:border-rose-900/50 rounded-xl p-3 text-sm">
                        <span className="font-bold text-rose-600 dark:text-rose-400 mr-3">Row {err.row}:</span>
                        <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                          {err.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Success Area */}
              {uploadResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 rounded-2xl p-6 overflow-hidden"
                >
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <h4 className="font-bold text-lg font-heading">Import Successful</h4>
                  </div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200/80 mb-4">{uploadResult.message}</p>
                  
                  <div className="flex gap-4">
                    <div className="bg-white dark:bg-background border border-emerald-100 dark:border-emerald-900/50 rounded-xl px-4 py-2 flex-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Inserted</p>
                      <p className="text-2xl font-black text-emerald-600">{uploadResult.inserted}</p>
                    </div>
                    <div className="bg-white dark:bg-background border border-emerald-100 dark:border-emerald-900/50 rounded-xl px-4 py-2 flex-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Skipped Duplicates</p>
                      <p className="text-2xl font-black text-amber-600">{uploadResult.skipped}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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