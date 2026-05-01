// app/dashboard/analytics/page.tsx
"use client";

import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Menu, TrendingUp, Target, Clock, BrainCircuit, AlertTriangle, CheckCircle2 } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const categoryPerformance = [
  { name: "Verbal Ability", score: 85, color: "bg-emerald-500", text: "text-emerald-500" },
  { name: "Numerical Ability", score: 42, color: "bg-rose-500", text: "text-rose-500" },
  { name: "Analytical Ability", score: 76, color: "bg-blue-500", text: "text-blue-500" },
  { name: "General Information", score: 92, color: "bg-accent", text: "text-accent" },
];

const recentExams = [
  { id: 1, date: "Apr 18, 2026", type: "Mock Exam", level: "Professional", score: "88%", status: "Passed" },
  { id: 2, date: "Apr 15, 2026", type: "Practice", level: "Numerical", score: "45%", status: "Needs Work" },
  { id: 3, date: "Apr 10, 2026", type: "Mock Exam", level: "Subprofessional", score: "92%", status: "Passed" },
  { id: 4, date: "Apr 05, 2026", type: "Practice", level: "Verbal", score: "85%", status: "Good" },
];

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="px-4 md:px-5 h-[52px] min-h-[52px] border-b border-border flex items-center gap-3 bg-background transition-colors duration-200">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground shrink-0">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[220px] border-r-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar className="flex border-none" />
            </SheetContent>
          </Sheet>

          <div className="font-heading text-[15px] font-bold tracking-tight truncate">
            Analytics
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-4 text-[11px] text-muted-foreground shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-8">
              
              {/* Header */}
              <div className="space-y-1.5">
                <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Your Performance Analytics
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track your progress, identify your weak areas, and optimize your review strategy.
                </p>
              </div>

              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Target className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
                    </div>
                    <div className="text-3xl font-bold font-mono">76.8%</div>
                    <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> +4.2% this week
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <BrainCircuit className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Exams Taken</span>
                    </div>
                    <div className="text-3xl font-bold font-mono">24</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total completed sessions
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Time Spent</span>
                    </div>
                    <div className="text-3xl font-bold font-mono">18h 45m</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total active review time
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
                    </div>
                    <div className="text-3xl font-bold font-mono">812</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Correct answers total
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Performance */}
                <Card className="lg:col-span-1 border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Category Performance</CardTitle>
                    <CardDescription>Your mastery level per subject area.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {categoryPerformance.map((cat) => (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{cat.name}</span>
                          <span className={`font-mono font-bold ${cat.text}`}>{cat.score}%</span>
                        </div>
                        <Progress value={cat.score} className={`h-2`} indicatorColor={cat.color} />
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-border mt-6">
                      <div className="flex items-start gap-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-rose-500">Focus Area Identified</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your performance in <strong>Numerical Ability</strong> is currently below the passing threshold. We recommend focusing your next Practice Mode sessions here.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent History Table */}
                <Card className="lg:col-span-2 border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Exam History</CardTitle>
                    <CardDescription>Your latest attempts and their results.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Level / Category</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentExams.map((exam) => (
                          <TableRow key={exam.id} className="border-border">
                            <TableCell className="font-medium text-muted-foreground">{exam.date}</TableCell>
                            <TableCell>{exam.type}</TableCell>
                            <TableCell>{exam.level}</TableCell>
                            <TableCell className="font-mono font-medium">{exam.score}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant="outline" 
                                className={
                                  exam.status === "Passed" || exam.status === "Good" 
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                }
                              >
                                {exam.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}