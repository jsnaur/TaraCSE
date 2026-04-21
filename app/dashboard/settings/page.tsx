"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Trash2, AlertTriangle, Sun, Moon, Monitor,
  Upload, Save, Eye, EyeOff, Type, Check, ChevronRight,
  Settings, Palette, type LucideProps,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types & Interfaces ────────────────────────────────────────────

interface MockUser {
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
}

interface ToastEntry {
  id: number;
  message: string;
}

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<LucideProps>;
  children: React.ReactNode;
  className?: string;
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

interface ProfileTabProps {
  showToast: (message: string) => void;
}

interface AppearanceTabProps {
  showToast: (message: string) => void;
}

interface ToastStackProps {
  toasts: ToastEntry[];
}

interface TabConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<LucideProps>;
}

interface ThemeOption {
  id: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  desc: string;
}

interface FontSizeOption {
  id: string;
  label: string;
  size: string;
  preview: string;
}

interface DangerActionProps {
  label: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "outline" | "destructive";
}

// ─── Mock Data ────────────────────────────────────────────────────

const MOCK_USER: MockUser = {
  name: "Juan Dela Cruz",
  email: "juan@example.com",
  avatar: null,
  initials: "JD",
};

const THEMES: ThemeOption[] = [
  { id: "light",  label: "Light",  icon: Sun,     desc: "Clean & bright" },
  { id: "dark",   label: "Dark",   icon: Moon,    desc: "Easy on the eyes" },
  { id: "system", label: "System", icon: Monitor, desc: "Follows your device" },
];

const FONT_SIZES: FontSizeOption[] = [
  { id: "standard", label: "Standard", size: "14px", preview: "Aa" },
  { id: "large",    label: "Large",    size: "17px", preview: "Aa" },
];

const TABS: TabConfig[] = [
  { id: "profile",    label: "Profile & Account", shortLabel: "Profile",    icon: User    },
  { id: "appearance", label: "Appearance",        shortLabel: "Appearance", icon: Palette },
];

// ─── Toast Stack (motion-animated, layered over shadcn ToastViewport) ──

function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card text-card-foreground border-border pointer-events-auto"
            style={{ minWidth: 260 }}
          >
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check size={12} className="text-primary-foreground" />
            </span>
            <span className="text-sm font-sans">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────

function SectionCard({ title, subtitle, icon: Icon, children, className = "" }: SectionCardProps) {
  return (
    <Card className={`rounded-2xl border-border ${className}`}>
      {(title || Icon) && (
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Icon size={15} className="text-primary" />
              </div>
            )}
            <div>
              {title && <CardTitle className="font-heading text-sm text-foreground">{title}</CardTitle>}
              {subtitle && <CardDescription className="text-xs text-muted-foreground font-sans mt-0.5">{subtitle}</CardDescription>}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ─── Field Wrapper ─────────────────────────────────────────────────

function Field({ label, hint, children, htmlFor }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wide"
      >
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground font-sans">{hint}</p>}
    </div>
  );
}

// ─── Danger Action (AlertDialog wrapper) ──────────────────────────

function DangerAction({
  label,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  onConfirm,
  variant = "outline",
}: DangerActionProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={
            variant === "destructive"
              ? "bg-destructive-foreground text-white hover:opacity-90"
              : "border-destructive-foreground/30 text-destructive-foreground hover:bg-destructive-foreground/10"
          }
        >
          <Trash2 size={14} className="mr-2" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-border bg-card">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-destructive-foreground" />
            </div>
            <div>
              <AlertDialogTitle className="font-heading text-base text-foreground">
                {confirmTitle}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground font-sans mt-1 leading-relaxed">
                {confirmDescription}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel className="rounded-lg font-sans">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-lg bg-destructive-foreground text-white font-sans hover:opacity-90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Profile & Account Tab ────────────────────────────────────────

function ProfileTab({ showToast }: ProfileTabProps) {
  const [name, setName] = useState<string>(MOCK_USER.name);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [currentPw, setCurrentPw] = useState<string>("");
  const [newPw, setNewPw] = useState<string>("");
  const [confirmPw, setConfirmPw] = useState<string>("");
  const [showPw, setShowPw] = useState<boolean>(false);

  const handleSaveProfile = (): void => {
    showToast("Profile updated successfully!");
  };

  const handleUpdatePassword = (): void => {
    if (!currentPw || !newPw || !confirmPw) {
      showToast("Please fill in all password fields.");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("New passwords do not match.");
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    showToast("Password updated successfully!");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarSrc(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Profile Information */}
      <SectionCard title="Profile Information" subtitle="Update your public display info" icon={User}>
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
          <div className="relative flex-shrink-0">
            <Avatar className="w-16 h-16 rounded-2xl">
              <AvatarImage src={avatarSrc ?? undefined} alt={name} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground font-heading text-xl">
                {MOCK_USER.initials}
              </AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-card border border-border cursor-pointer flex items-center justify-center hover:bg-muted transition-colors">
              <Upload size={12} className="text-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <p className="font-heading text-sm text-foreground">{name || MOCK_USER.name}</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">{MOCK_USER.email}</p>
            <p className="text-xs text-muted-foreground font-sans mt-1">Click the icon to change avatar</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Display Name" htmlFor="display-name">
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl"
            />
          </Field>
          <Field label="Email Address" htmlFor="email" hint="Contact support to change your email.">
            <Input
              id="email"
              value={MOCK_USER.email}
              disabled
              className="rounded-xl"
            />
          </Field>
          <Button
            onClick={handleSaveProfile}
            className="self-start rounded-xl bg-primary text-primary-foreground hover:opacity-90"
          >
            <Save size={14} className="mr-2" /> Save Profile
          </Button>
        </div>
      </SectionCard>

      <Separator className="bg-border" />

      {/* Password Management */}
      <SectionCard title="Password Management" subtitle="Keep your account secure" icon={Lock}>
        <div className="flex flex-col gap-4">
          <Field label="Current Password" htmlFor="current-pw">
            <div className="relative">
              <Input
                id="current-pw"
                type={showPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <Field label="New Password" htmlFor="new-pw">
            <Input
              id="new-pw"
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              className="rounded-xl"
            />
          </Field>
          <Field label="Confirm New Password" htmlFor="confirm-pw">
            <Input
              id="confirm-pw"
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              className="rounded-xl"
            />
          </Field>
          <Button
            onClick={handleUpdatePassword}
            className="self-start rounded-xl bg-primary text-primary-foreground hover:opacity-90"
          >
            <Lock size={14} className="mr-2" /> Update Password
          </Button>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <div className="bg-destructive border border-destructive-foreground/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-destructive-foreground/10 flex items-center justify-center">
            <AlertTriangle size={15} className="text-destructive-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-sm text-destructive-foreground">Danger Zone</h3>
            <p className="text-xs text-destructive-foreground/70 font-sans mt-0.5">
              Irreversible actions — proceed with caution
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DangerAction
            label="Reset Progress"
            confirmTitle="Reset all progress?"
            confirmDescription="This will permanently delete your mock exam history, scores, and performance data. This action cannot be undone."
            confirmLabel="Reset Progress"
            onConfirm={() => showToast("Exam progress has been reset.")}
            variant="outline"
          />
          <DangerAction
            label="Delete Account"
            confirmTitle="Delete your account?"
            confirmDescription="Your account, profile, and all associated data will be permanently removed. This cannot be reversed."
            confirmLabel="Delete Account"
            onConfirm={() => showToast("Account deletion requested.")}
            variant="destructive"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────

function AppearanceTab({ showToast }: AppearanceTabProps) {
  const [theme, setTheme] = useState<string>("system");
  const [fontSize, setFontSize] = useState<string>("standard");

  const handleThemeChange = (id: string): void => {
    setTheme(id);
    showToast(`Theme set to "${id}".`);
  };

  const handleFontSizeChange = (id: string): void => {
    setFontSize(id);
    showToast(`Font size set to "${id}".`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Theme Selection */}
      <SectionCard title="Theme" subtitle="Choose your preferred color scheme" icon={Palette}>
        <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map(({ id, label, icon: Icon, desc }) => {
            const active = theme === id;
            return (
              <Label
                key={id}
                htmlFor={`theme-${id}`}
                className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem id={`theme-${id}`} value={id} className="sr-only" />
                {active && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check size={9} className="text-primary-foreground" />
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-primary" : "bg-muted"}`}>
                  <Icon size={18} className={active ? "text-primary-foreground" : "text-muted-foreground"} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-heading ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">{desc}</p>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </SectionCard>

      {/* Font Size */}
      <SectionCard title="Reading Size" subtitle="Adjust text size for exam readability" icon={Type}>
        <RadioGroup value={fontSize} onValueChange={handleFontSizeChange} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FONT_SIZES.map(({ id, label, size, preview }) => {
            const active = fontSize === id;
            return (
              <Label
                key={id}
                htmlFor={`size-${id}`}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem id={`size-${id}`} value={id} className="sr-only" />
                {active && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check size={9} className="text-primary-foreground" />
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-heading flex-shrink-0 ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                  style={{ fontSize: size }}
                >
                  {preview}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-heading ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">Base size: {size}</p>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
        <p className="mt-3 text-xs text-muted-foreground font-sans">
          Larger text improves readability during timed CSE mock exams.
        </p>
      </SectionCard>
    </div>
  );
}

// ─── Settings Dashboard (root) ────────────────────────────────────

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = (message: string): void => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastStack toasts={toasts} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Settings size={17} className="text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl text-foreground">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground font-sans ml-12">
            Manage your TaraCSE account preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-sans transition-all duration-200 text-left ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  {active && <ChevronRight size={13} className="ml-auto opacity-70" />}
                </button>
              );
            })}
          </aside>

          {/* Tab bar — mobile */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {TABS.map(({ id, shortLabel, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {shortLabel}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeTab === "profile" && <ProfileTab showToast={showToast} />}
                {activeTab === "appearance" && <AppearanceTab showToast={showToast} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}