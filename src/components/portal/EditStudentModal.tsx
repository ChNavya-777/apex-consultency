import { useState, useEffect } from "react";
import { Loader2, Lock, User, GraduationCap, Compass, Languages, Wallet, FileText, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUpdateStudentProfile } from "@/lib/use-portal-data";
import type { StudentProfile } from "@/lib/portal-data";

interface EditStudentModalProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function EditStudentModal({ student, isOpen, onClose, onSaved }: EditStudentModalProps) {
  const updateProfileMutation = useUpdateStudentProfile();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentDegree, setCurrentDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [preferredCountry, setPreferredCountry] = useState("");
  const [preferredCourse, setPreferredCourse] = useState("");
  const [preferredIntake, setPreferredIntake] = useState("");
  const [englishTest, setEnglishTest] = useState("");
  const [budget, setBudget] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  useEffect(() => {
    if (student) {
      setFullName(student.fullName || "");
      setPhone(student.phone || "");
      setCurrentDegree(student.currentDegree || "");
      setBranch(student.branch || "");
      setGraduationYear(student.graduationYear || "");
      setCgpa(student.cgpa || "");
      setPreferredCountry(student.preferredCountry || "");
      setPreferredCourse(student.preferredCourse || "");
      setPreferredIntake(student.preferredIntake || "");
      setEnglishTest(student.englishTest || "");
      setBudget(student.budget || "");
      setAdditionalInfo(student.additionalInfo || "");
      setFeedback(null);
    }
  }, [student, isOpen]);

  if (!student) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const targetStudentId = student?.id || student?.email;
    if (!targetStudentId) {
      setFeedback({ type: "error", message: "Student identifier is missing." });
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFeedback({ type: "error", message: "Full Name is required (minimum 2 characters)." });
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        studentId: targetStudentId,
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        currentDegree: currentDegree.trim() || null,
        branch: branch.trim() || null,
        graduationYear: graduationYear.trim() || null,
        cgpa: cgpa.trim() || null,
        preferredCountry: preferredCountry.trim() || null,
        preferredCourse: preferredCourse.trim() || null,
        preferredIntake: preferredIntake.trim() || null,
        englishTest: englishTest.trim() || null,
        budget: budget.trim() || null,
        additionalInfo: additionalInfo.trim() || null,
      });

      setFeedback({ type: "success", message: "Student profile updated successfully!" });
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update student profile.",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="h-5 w-5 text-primary" />
            Edit Student Profile
          </DialogTitle>
          <DialogDescription>
            Update core student details. Email identity is read-only and remains unchanged.
          </DialogDescription>
        </DialogHeader>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Section 1: Personal Information */}
          <div className="space-y-3 rounded-lg border border-border/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm border-b border-border/40 pb-2">
              <User className="h-4 w-4 text-primary" />
              <span>1. Personal Information</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email Address
                  </Label>
                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" /> Read-Only
                  </Badge>
                </div>
                <Input
                  id="email"
                  value={student.email}
                  disabled
                  className="bg-muted/40 cursor-not-allowed text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="phone" className="text-xs font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Information */}
          <div className="space-y-3 rounded-lg border border-border/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm border-b border-border/40 pb-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>2. Academic Information</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currentDegree" className="text-xs font-medium">
                  Current / Highest Degree
                </Label>
                <Input
                  id="currentDegree"
                  value={currentDegree}
                  onChange={(e) => setCurrentDegree(e.target.value)}
                  placeholder="e.g. B.Tech / B.Sc / B.Com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch" className="text-xs font-medium">
                  Branch / Specialisation
                </Label>
                <Input
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="graduationYear" className="text-xs font-medium">
                  Graduation Year
                </Label>
                <Input
                  id="graduationYear"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2025"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cgpa" className="text-xs font-medium">
                  CGPA / Percentage
                </Label>
                <Input
                  id="cgpa"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.5 CGPA / 85%"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Study Preferences */}
          <div className="space-y-3 rounded-lg border border-border/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm border-b border-border/40 pb-2">
              <Compass className="h-4 w-4 text-primary" />
              <span>3. Study Preferences</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="preferredCountry" className="text-xs font-medium">
                  Preferred Country
                </Label>
                <Input
                  id="preferredCountry"
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredCourse" className="text-xs font-medium">
                  Preferred Course
                </Label>
                <Input
                  id="preferredCourse"
                  value={preferredCourse}
                  onChange={(e) => setPreferredCourse(e.target.value)}
                  placeholder="e.g. MSc Data Science"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredIntake" className="text-xs font-medium">
                  Preferred Intake
                </Label>
                <Input
                  id="preferredIntake"
                  value={preferredIntake}
                  onChange={(e) => setPreferredIntake(e.target.value)}
                  placeholder="e.g. Sep 2026"
                />
              </div>
            </div>
          </div>

          {/* Section 4 & 5: English Test & Financial Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border/60 bg-surface/50 p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground text-sm border-b border-border/40 pb-2">
                <Languages className="h-4 w-4 text-primary" />
                <span>4. English / Test Status</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="englishTest" className="text-xs font-medium">
                  IELTS / PTE / TOEFL Status
                </Label>
                <Input
                  id="englishTest"
                  value={englishTest}
                  onChange={(e) => setEnglishTest(e.target.value)}
                  placeholder="e.g. IELTS 7.5 overall / Planning to take"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 bg-surface/50 p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground text-sm border-b border-border/40 pb-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span>5. Financial Information</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget" className="text-xs font-medium">
                  Budget Range
                </Label>
                <Input
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. ₹20 - 30 Lakhs / £15,000 - £25,000"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Additional Information */}
          <div className="space-y-3 rounded-lg border border-border/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm border-b border-border/40 pb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>6. Additional Information</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="additionalInfo" className="text-xs font-medium">
                Anything Else We Should Know
              </Label>
              <Textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Additional notes regarding career goals, backlogs, gaps, or special requirements..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateProfileMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
