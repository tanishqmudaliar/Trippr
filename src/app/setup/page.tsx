"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { generateId } from "@/lib/types";
import {
  Building2,
  User,
  Car,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  FileSignature,
  Upload,
  X,
  Cloud,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  saveAsset,
  fileToBase64,
  validateImageFile,
  type AssetKey,
} from "@/lib/assetStorage";
import {
  authenticateWithGoogle,
  downloadSyncData,
  isTokenValid,
  type GoogleAuthState,
} from "@/lib/googleDrive";

type Step = "company" | "profile" | "vehicle" | "client" | "branding";

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  onKeyDown,
  placeholder,
  required = true,
  error,
  icon: Icon,
  helperText,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: React.ElementType;
  helperText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700">
          {label}
          {required && <span className="text-saffron-600 ml-1">*</span>}
        </label>
        {helperText && (
          <span className="text-[11px] text-navy-400">{helperText}</span>
        )}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={Icon ? { paddingLeft: "2.6rem" } : undefined}
          className={`input-field ${Icon ? "pl-10" : ""} ${
            error ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500" : ""
          }`}
        />
      </div>
      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const allSteps: { id: Step; label: string; icon: React.ElementType; description: string }[] = [
  { id: "company", label: "Company", icon: Building2, description: "Official business info" },
  { id: "profile", label: "Profile", icon: User, description: "Operator details" },
  { id: "vehicle", label: "Fleet", icon: Car, description: "Primary vehicle" },
  { id: "client", label: "Client", icon: Users, description: "First client tariff" },
  { id: "branding", label: "Branding", icon: ImageIcon, description: "Invoice logo & signature" },
];

const brandingOnlySteps: {
  id: Step;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [{ id: "branding", label: "Branding", icon: ImageIcon, description: "Invoice logo & signature" }];

export default function SetupPage() {
  const router = useRouter();
  const {
    isSetupComplete,
    isBrandingComplete,
    completeSetup,
    restoreFromBackup,
    markBrandingComplete,
    companyInfo,
    userProfile,
    vehicles,
    clients,
  } = useStore();

  const isReturningUser = isSetupComplete && !isBrandingComplete;
  const steps = isReturningUser ? brandingOnlySteps : allSteps;

  const [showWelcome, setShowWelcome] = useState(!isReturningUser);
  const [currentStep, setCurrentStep] = useState<Step>(
    isReturningUser ? "branding" : "company",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCloudRestoring, setIsCloudRestoring] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [companyData, setCompanyData] = useState({
    companyName: companyInfo?.companyName || "",
    businessContact: companyInfo?.businessContact || "",
    businessEmail: companyInfo?.businessEmail || "",
    address: companyInfo?.address || "",
  });

  const [profileData, setProfileData] = useState({
    firstName: userProfile?.firstName || "",
    lastName: userProfile?.lastName || "",
    timeFormat: (userProfile?.timeFormat || "24hr") as "12hr" | "24hr",
  });

  const [vehicleData, setVehicleData] = useState({
    numberPlate: vehicles[0]?.numberPlate || "",
    model: vehicles[0]?.model || "",
  });

  const firstClient = clients[0];
  const [clientData, setClientData] = useState({
    name: firstClient?.name || "",
    baseKmsPerDay: firstClient?.baseKmsPerDay?.toString() || "80",
    baseHoursPerDay: firstClient?.baseHoursPerDay?.toString() || "8",
    perDayRate: firstClient?.perDayRate?.toString() || "1500",
    extraKmRate: firstClient?.extraKmRate?.toString() || "15",
    extraHourRate: firstClient?.extraHourRate?.toString() || "150",
    serviceTaxPercent: firstClient?.serviceTaxPercent?.toString() || "0",
  });

  const [brandingData, setBrandingData] = useState<{
    logoBase64: string | null;
    signatureBase64: string | null;
  }>({
    logoBase64: null,
    signatureBase64: null,
  });
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSetupComplete && isBrandingComplete) {
      router.replace("/dashboard");
    }
  }, [isSetupComplete, isBrandingComplete, router]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case "company":
        if (!companyData.companyName.trim())
          newErrors.companyName = "Company name is required";
        if (!companyData.businessContact.trim())
          newErrors.businessContact = "Contact phone number is required";
        else if (!/^\d{10,15}$/.test(companyData.businessContact.trim()))
          newErrors.businessContact = "Enter a valid 10-15 digit phone number";
        if (!companyData.businessEmail.trim())
          newErrors.businessEmail = "Business email is required";
        else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.businessEmail.trim())
        )
          newErrors.businessEmail = "Enter a valid email address";
        if (!companyData.address.trim())
          newErrors.address = "Office address is required";
        break;

      case "profile":
        if (!profileData.firstName.trim())
          newErrors.firstName = "First name is required";
        if (!profileData.lastName.trim())
          newErrors.lastName = "Last name is required";
        break;

      case "vehicle":
        if (!vehicleData.numberPlate.trim())
          newErrors.numberPlate = "Registration number plate is required";
        if (!vehicleData.model.trim())
          newErrors.model = "Vehicle model is required";
        break;

      case "client":
        if (!clientData.name.trim()) newErrors.name = "Client name is required";
        if (!clientData.baseKmsPerDay)
          newErrors.baseKmsPerDay = "Base KMs quota is required";
        else if (Number(clientData.baseKmsPerDay) <= 0)
          newErrors.baseKmsPerDay = "Must be greater than 0";
        if (!clientData.baseHoursPerDay)
          newErrors.baseHoursPerDay = "Base hours quota is required";
        else if (
          Number(clientData.baseHoursPerDay) <= 0 ||
          Number(clientData.baseHoursPerDay) > 24
        )
          newErrors.baseHoursPerDay = "Must be between 1 and 24";
        if (!clientData.perDayRate)
          newErrors.perDayRate = "Per day rate is required";
        else if (Number(clientData.perDayRate) <= 0)
          newErrors.perDayRate = "Must be greater than 0";
        if (!clientData.extraKmRate)
          newErrors.extraKmRate = "Extra KM rate is required";
        else if (Number(clientData.extraKmRate) < 0)
          newErrors.extraKmRate = "Cannot be negative";
        if (!clientData.extraHourRate)
          newErrors.extraHourRate = "Extra hour rate is required";
        else if (Number(clientData.extraHourRate) < 0)
          newErrors.extraHourRate = "Cannot be negative";
        if (
          clientData.serviceTaxPercent &&
          Number(clientData.serviceTaxPercent) < 0
        )
          newErrors.serviceTaxPercent = "Cannot be negative";
        else if (
          clientData.serviceTaxPercent &&
          Number(clientData.serviceTaxPercent) > 100
        )
          newErrors.serviceTaxPercent = "Cannot exceed 100%";
        break;

      case "branding":
        if (!brandingData.logoBase64) {
          newErrors.logo = "Company logo is required for official invoices";
        }
        if (!brandingData.signatureBase64) {
          newErrors.signature = "Authorised signature is required for invoices";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBrandingUpload = async (
    type: AssetKey,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setBrandingError(validation.error || "Invalid file format");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      if (type === "logo") {
        setBrandingData((prev) => ({ ...prev, logoBase64: base64 }));
      } else {
        setBrandingData((prev) => ({ ...prev, signatureBase64: base64 }));
      }
      setBrandingError(null);
    } catch {
      setBrandingError(`Failed to process ${type}`);
    }

    event.target.value = "";
  };

  const handleBrandingRemove = (type: AssetKey) => {
    if (type === "logo") {
      setBrandingData((prev) => ({ ...prev, logoBase64: null }));
    } else {
      setBrandingData((prev) => ({ ...prev, signatureBase64: null }));
    }
  };

  const handleRestoreFromFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setIsRestoring(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (
        !data.companyInfo ||
        !data.userProfile ||
        !data.vehicles ||
        !data.clients
      ) {
        throw new Error("Invalid backup archive format");
      }

      const hasLogo = !!data.logoBase64;
      const hasSignature = !!data.signatureBase64;
      const hasBothAssets = hasLogo && hasSignature;

      if (hasLogo) {
        await saveAsset("logo", data.logoBase64);
      }
      if (hasSignature) {
        await saveAsset("signature", data.signatureBase64);
      }

      restoreFromBackup({
        companyInfo: data.companyInfo,
        userProfile: data.userProfile,
        vehicles: data.vehicles,
        clients: data.clients,
        entries: data.entries || [],
        invoices: data.invoices || [],
        backupConfig: data.backupConfig || null,
        isBrandingComplete: hasBothAssets,
      });

      router.replace("/dashboard");
    } catch (err) {
      console.error("Restore error:", err);
      setRestoreError(
        err instanceof Error ? err.message : "Failed to restore backup archive",
      );
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  };

  const handleRestoreFromCloud = async () => {
    setCloudError(null);
    setIsCloudRestoring(true);

    try {
      const auth: GoogleAuthState = await authenticateWithGoogle();

      if (!isTokenValid(auth)) {
        throw new Error("Google authentication failed");
      }

      const cloudData = await downloadSyncData(auth.accessToken);

      if (!cloudData) {
        throw new Error(
          "No Trippr cloud backup found in this Google Drive account. Please start fresh or use a local file.",
        );
      }

      if (
        !cloudData.companyInfo ||
        !cloudData.userProfile ||
        !cloudData.vehicles ||
        !cloudData.clients
      ) {
        throw new Error("Corrupted cloud backup snapshot");
      }

      const hasLogo = !!cloudData.logoBase64;
      const hasSignature = !!cloudData.signatureBase64;
      const hasBothAssets = hasLogo && hasSignature;

      if (hasLogo) {
        await saveAsset("logo", cloudData.logoBase64 as string);
      }
      if (hasSignature) {
        await saveAsset("signature", cloudData.signatureBase64 as string);
      }

      restoreFromBackup({
        companyInfo: cloudData.companyInfo as Parameters<typeof restoreFromBackup>[0]["companyInfo"],
        userProfile: cloudData.userProfile as Parameters<typeof restoreFromBackup>[0]["userProfile"],
        vehicles: cloudData.vehicles as Parameters<typeof restoreFromBackup>[0]["vehicles"],
        clients: cloudData.clients as Parameters<typeof restoreFromBackup>[0]["clients"],
        entries: (cloudData.entries || []) as Parameters<typeof restoreFromBackup>[0]["entries"],
        invoices: (cloudData.invoices || []) as Parameters<typeof restoreFromBackup>[0]["invoices"],
        backupConfig: cloudData.backupConfig as Parameters<typeof restoreFromBackup>[0]["backupConfig"],
        isBrandingComplete: hasBothAssets,
      });

      localStorage.setItem("trippr-google-auth", JSON.stringify(auth));
      router.replace("/dashboard");
    } catch (err) {
      console.error("Cloud restore error:", err);
      setCloudError(
        err instanceof Error ? err.message : "Failed to restore cloud snapshot",
      );
    } finally {
      setIsCloudRestoring(false);
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handlePrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    } else {
      setShowWelcome(true);
    }
  };

  const handleComplete = async () => {
    if (!validateStep("branding")) return;

    if (brandingData.logoBase64) {
      await saveAsset("logo", brandingData.logoBase64);
    }
    if (brandingData.signatureBase64) {
      await saveAsset("signature", brandingData.signatureBase64);
    }

    if (isReturningUser) {
      markBrandingComplete();
      router.replace("/dashboard");
      return;
    }

    completeSetup({
      companyInfo: {
        id: "company-info",
        companyName: companyData.companyName.trim(),
        businessContact: companyData.businessContact.trim(),
        businessEmail: companyData.businessEmail.trim(),
        address: companyData.address.trim(),
      },
      userProfile: {
        id: "user-profile",
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        timeFormat: profileData.timeFormat,
      },
      vehicle: {
        id: generateId(),
        numberPlate: vehicleData.numberPlate.trim().toUpperCase(),
        model: vehicleData.model.trim(),
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      client: {
        id: generateId(),
        name: clientData.name.trim(),
        baseKmsPerDay: Number(clientData.baseKmsPerDay) || 80,
        baseHoursPerDay: Number(clientData.baseHoursPerDay) || 8,
        perDayRate: Number(clientData.perDayRate) || 1500,
        extraKmRate: Number(clientData.extraKmRate) || 15,
        extraHourRate: Number(clientData.extraHourRate) || 150,
        serviceTaxPercent: Number(clientData.serviceTaxPercent) || 0,
        createdAt: new Date().toISOString(),
      },
    });

    router.replace("/dashboard");
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, isLastField: boolean) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isLastField) {
          if (!validateStep(currentStep)) return;
          if (currentStepIndex === steps.length - 1) {
            handleComplete();
          } else {
            handleNext();
          }
        }
      }
    },
    [currentStepIndex, currentStep, steps.length, validateStep, handleComplete, handleNext],
  );

  if (isSetupComplete && isBrandingComplete) {
    return null;
  }

  // 1. Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50/40 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          {/* Brand Emblem */}
          <div className="text-center pt-4 pb-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-saffron-50 border border-saffron-200/80 mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
              <span className="text-xs font-semibold text-saffron-800">
                Commercial Transport Invoicing
              </span>
            </div>

            <div className="mb-3">
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: "3.2rem",
                  color: "#ea580c",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                Trippr
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight">
              Welcome to Your Transport Hub
            </h1>
            <p className="text-xs sm:text-sm text-navy-500 max-w-md mx-auto mt-1">
              Offline-first duty slip management, automatic tax invoicing, and Google Drive cloud backup.
            </p>
          </div>

          {/* Main Selection Card */}
          <div className="card p-5 sm:p-8 space-y-4 shadow-floating">
            <h2 className="font-display text-base sm:text-lg font-bold text-navy-900 text-center pb-2 border-b border-cream-200/80">
              Select Setup Preference
            </h2>

            {/* Option 1: Start Fresh */}
            <button
              onClick={() => setShowWelcome(false)}
              className="group w-full p-4 rounded-2xl border border-cream-200/90 hover:border-saffron-300 bg-white hover:bg-saffron-50/40 transition-all text-left shadow-subtle hover:shadow-soft flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-saffron-100 text-saffron-600 flex items-center justify-center shrink-0 border border-saffron-200/80 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-navy-950 group-hover:text-saffron-700 transition-colors">
                    Start Fresh Onboarding
                  </h3>
                  <ArrowRight className="w-4 h-4 text-navy-400 group-hover:text-saffron-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-navy-500 mt-1 leading-relaxed">
                  Step-by-step wizard to register your company profile, vehicle fleet, and initial client tariff.
                </p>
              </div>
            </button>

            {/* Option 2: Restore from Google Drive */}
            <div className="p-4 rounded-2xl border border-cream-200/90 bg-cream-50/60 space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-navy-950">
                    Restore from Google Drive
                  </h3>
                  <p className="text-xs text-navy-500 mt-0.5 leading-relaxed">
                    Connect your existing Google account to restore duties, invoices, and company branding from cloud.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRestoreFromCloud}
                disabled={isCloudRestoring}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-cream-300 hover:border-saffron-400 hover:bg-cream-50 text-xs font-semibold text-navy-800 transition-all shadow-xs disabled:opacity-50"
              >
                {isCloudRestoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting Google Drive...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Connect Existing Google Account</span>
                  </>
                )}
              </button>

              {cloudError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200/70 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{cloudError}</span>
                </p>
              )}
            </div>

            {/* Option 3: Restore from Local File */}
            <div className="p-4 rounded-2xl border border-cream-200/90 bg-cream-50/60 space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-navy-950">
                    Import Local Backup Archive
                  </h3>
                  <p className="text-xs text-navy-500 mt-0.5 leading-relaxed">
                    Upload a .json backup file generated from another Trippr installation.
                  </p>
                </div>
              </div>

              <input
                ref={restoreInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFromFile}
                className="hidden"
              />

              <button
                onClick={() => restoreInputRef.current?.click()}
                disabled={isRestoring}
                className="btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {isRestoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin" />
                    <span>Importing Archive...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Select .json Backup File</span>
                  </>
                )}
              </button>

              {restoreError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200/70 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{restoreError}</span>
                </p>
              )}
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-navy-400">
              Commercial Transport Invoicing &bull; Crafted by{" "}
              <a
                href="https://github.com/tanishqmudaliar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-saffron-600 hover:underline"
              >
                Tanishq Mudaliar
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Multi-step Onboarding Wizard
  return (
    <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50/40 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        {/* Wizard Header */}
        <div className="text-center pt-2 pb-6">
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: "2.4rem",
              color: "#ea580c",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Trippr
          </span>
          <h1 className="font-display text-2xl font-bold text-navy-950 mt-1">
            {isReturningUser ? "Complete Invoicing Assets" : "Initial Workspace Setup"}
          </h1>
          <p className="text-xs sm:text-sm text-navy-500">
            {isReturningUser
              ? "Upload company logo and signature for your generated PDF invoices"
              : `Step ${currentStepIndex + 1} of ${steps.length}: ${steps[currentStepIndex].description}`}
          </p>
        </div>

        {/* Connected Stepper Progress Bar */}
        {!isReturningUser && (
          <div className="mb-8 px-2 sm:px-6">
            <div className="relative flex items-center justify-between">
              {/* Connecting Background Line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-cream-200/90 z-0" />
              {/* Active Fill Line */}
              <motion.div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-linear-to-r from-saffron-500 to-saffron-600 z-0"
                style={{
                  width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                  maxWidth: "calc(100% - 3rem)",
                }}
                transition={{ duration: 0.3 }}
              />

              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className="relative z-10 flex flex-col items-center"
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCompleted
                          ? "bg-emerald-600 text-white shadow-xs"
                          : isActive
                            ? "bg-saffron-500 text-white shadow-soft ring-4 ring-saffron-100"
                            : "bg-white text-navy-400 border border-cream-300"
                      }`}
                      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </motion.div>
                    <span
                      className={`text-[11px] font-semibold mt-1.5 tracking-tight ${
                        isActive
                          ? "text-saffron-700"
                          : isCompleted
                            ? "text-emerald-700"
                            : "text-navy-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wizard Card */}
        <div className="card p-6 sm:p-8 shadow-floating">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1: Company Information */}
              {currentStep === "company" && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-cream-200/80">
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      Company / Operator Information
                    </h2>
                    <p className="text-xs text-navy-500">
                      This appears on all official tax invoices and customer receipts.
                    </p>
                  </div>

                  <InputField
                    label="Company Name"
                    name="companyName"
                    value={companyData.companyName}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, companyName: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g. Om Sai Travels & Logistics"
                    icon={Building2}
                    error={errors.companyName}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Contact Number"
                      name="businessContact"
                      value={companyData.businessContact}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, businessContact: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="e.g. 9876543210"
                      icon={Phone}
                      error={errors.businessContact}
                    />

                    <InputField
                      label="Official Email"
                      name="businessEmail"
                      type="email"
                      value={companyData.businessEmail}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, businessEmail: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="e.g. contact@travels.com"
                      icon={Mail}
                      error={errors.businessEmail}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700">
                      Registered Address <span className="text-saffron-600">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-navy-400 pointer-events-none" />
                      <textarea
                        value={companyData.address}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, address: e.target.value })
                        }
                        rows={3}
                        style={{ paddingLeft: "2.6rem" }}
                        className={`input-field pl-10 ${
                          errors.address ? "border-rose-400 focus:ring-rose-500/20" : ""
                        }`}
                        placeholder="Shop No, Street, City, State, PIN"
                      />
                    </div>
                    {errors.address && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Personal Profile */}
              {currentStep === "profile" && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-cream-200/80">
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      Operator Profile & Preferences
                    </h2>
                    <p className="text-xs text-navy-500">
                      Personalize your dashboard greeting and time formatting.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="First Name"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="e.g. Rajesh"
                      icon={User}
                      error={errors.firstName}
                    />

                    <InputField
                      label="Last Name"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, lastName: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="e.g. Sharma"
                      icon={User}
                      error={errors.lastName}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700">
                      Preferred Duty Time Display
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setProfileData({ ...profileData, timeFormat: "12hr" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          profileData.timeFormat === "12hr"
                            ? "border-saffron-400 bg-saffron-50/80 text-navy-950 shadow-xs"
                            : "border-cream-200/90 bg-white text-navy-600 hover:border-cream-300"
                        }`}
                      >
                        <span className="font-semibold text-xs block">12-Hour Clock</span>
                        <span className="text-[11px] text-navy-400 font-mono">09:30 AM / 06:15 PM</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setProfileData({ ...profileData, timeFormat: "24hr" })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          profileData.timeFormat === "24hr"
                            ? "border-saffron-400 bg-saffron-50/80 text-navy-950 shadow-xs"
                            : "border-cream-200/90 bg-white text-navy-600 hover:border-cream-300"
                        }`}
                      >
                        <span className="font-semibold text-xs block">24-Hour Military</span>
                        <span className="text-[11px] text-navy-400 font-mono">09:30 / 18:15</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Vehicle Fleet */}
              {currentStep === "vehicle" && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-cream-200/80">
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      Primary Fleet Vehicle
                    </h2>
                    <p className="text-xs text-navy-500">
                      You can add more vehicles anytime from the Settings page.
                    </p>
                  </div>

                  <InputField
                    label="Registration Number Plate"
                    name="numberPlate"
                    value={vehicleData.numberPlate}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        numberPlate: e.target.value.toUpperCase(),
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g. MH-01-AB-1234"
                    icon={Car}
                    error={errors.numberPlate}
                    helperText="Standard uppercase registration"
                  />

                  {/* Live Plate Preview */}
                  {vehicleData.numberPlate.trim() && (
                    <div className="p-3.5 rounded-xl bg-cream-50/80 border border-cream-200/80 flex items-center justify-between">
                      <span className="text-xs text-navy-500 font-medium">Plate Preview:</span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-200/90 border border-amber-400/80 shadow-xs">
                        <span className="text-[10px] font-bold text-amber-900">IND</span>
                        <span className="font-mono text-xs font-bold text-navy-950 tracking-wider">
                          {vehicleData.numberPlate.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  <InputField
                    label="Vehicle Model / Make"
                    name="model"
                    value={vehicleData.model}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, model: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    placeholder="e.g. Maruti Suzuki Swift Dzire / Toyota Innova"
                    icon={Car}
                    error={errors.model}
                  />
                </div>
              )}

              {/* STEP 4: First Client & Tariff */}
              {currentStep === "client" && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-cream-200/80">
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      First Client & Billing Tariff
                    </h2>
                    <p className="text-xs text-navy-500">
                      Set base packages and extra kilometer/hour charges.
                    </p>
                  </div>

                  <InputField
                    label="Client / Corporate Name"
                    name="name"
                    value={clientData.name}
                    onChange={(e) =>
                      setClientData({ ...clientData, name: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g. L&T Power / Acme Corp"
                    icon={Users}
                    error={errors.name}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Base KMs / Day"
                      name="baseKmsPerDay"
                      type="number"
                      value={clientData.baseKmsPerDay}
                      onChange={(e) =>
                        setClientData({ ...clientData, baseKmsPerDay: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="80"
                      error={errors.baseKmsPerDay}
                      helperText="Default 80 km"
                    />

                    <InputField
                      label="Base Hours / Day"
                      name="baseHoursPerDay"
                      type="number"
                      value={clientData.baseHoursPerDay}
                      onChange={(e) =>
                        setClientData({ ...clientData, baseHoursPerDay: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="8"
                      error={errors.baseHoursPerDay}
                      helperText="Default 8 hrs"
                    />
                  </div>

                  <InputField
                    label="Per Day Package Rate (₹)"
                    name="perDayRate"
                    type="number"
                    value={clientData.perDayRate}
                    onChange={(e) =>
                      setClientData({ ...clientData, perDayRate: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="1500"
                    error={errors.perDayRate}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Extra KM Rate (₹/km)"
                      name="extraKmRate"
                      type="number"
                      value={clientData.extraKmRate}
                      onChange={(e) =>
                        setClientData({ ...clientData, extraKmRate: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="15"
                      error={errors.extraKmRate}
                    />

                    <InputField
                      label="Extra Hour Rate (₹/hr)"
                      name="extraHourRate"
                      type="number"
                      value={clientData.extraHourRate}
                      onChange={(e) =>
                        setClientData({ ...clientData, extraHourRate: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="150"
                      error={errors.extraHourRate}
                    />
                  </div>

                  <InputField
                    label="Service Tax / GST % (Optional)"
                    name="serviceTaxPercent"
                    type="number"
                    value={clientData.serviceTaxPercent}
                    onChange={(e) =>
                      setClientData({ ...clientData, serviceTaxPercent: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    placeholder="0"
                    required={false}
                    error={errors.serviceTaxPercent}
                    helperText="Leave 0 if not tax-registered"
                  />
                </div>
              )}

              {/* STEP 5: Branding Assets (Logo & Signature) */}
              {currentStep === "branding" && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-cream-200/80">
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      Company Logo & Authorised Signature
                    </h2>
                    <p className="text-xs text-navy-500">
                      Upload your logo and signature to stamp formal PDF invoices.
                    </p>
                  </div>

                  {brandingError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="flex-1 font-medium">{brandingError}</span>
                      <button
                        onClick={() => setBrandingError(null)}
                        className="hover:bg-rose-100 rounded p-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company Logo Upload Box */}
                    <div className="p-4 rounded-xl border border-cream-200/90 bg-cream-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">
                          Company Logo <span className="text-saffron-600">*</span>
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center min-h-36 border-2 border-dashed border-cream-300 rounded-xl p-3 bg-white text-center">
                        {brandingData.logoBase64 ? (
                          <div className="space-y-2 w-full">
                            <img
                              src={brandingData.logoBase64}
                              alt="Company Logo"
                              className="max-h-20 mx-auto object-contain"
                            />
                            <p className="text-[11px] font-medium text-emerald-700">
                              Logo uploaded
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-2">
                            <ImageIcon className="w-8 h-8 mx-auto text-cream-400" />
                            <p className="text-xs text-navy-500 font-medium">No logo uploaded</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="btn-secondary flex-1 py-1.5 px-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {brandingData.logoBase64 ? "Change" : "Upload Logo"}
                        </button>
                        {brandingData.logoBase64 && (
                          <button
                            type="button"
                            onClick={() => handleBrandingRemove("logo")}
                            className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                            title="Remove logo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleBrandingUpload("logo", e)}
                        className="hidden"
                      />
                      {errors.logo && (
                        <p className="text-[11px] text-rose-600 font-medium">{errors.logo}</p>
                      )}
                    </div>

                    {/* Signature Upload Box */}
                    <div className="p-4 rounded-xl border border-cream-200/90 bg-cream-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">
                          Signatory Signature <span className="text-saffron-600">*</span>
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center min-h-36 border-2 border-dashed border-cream-300 rounded-xl p-3 bg-white text-center">
                        {brandingData.signatureBase64 ? (
                          <div className="space-y-2 w-full">
                            <img
                              src={brandingData.signatureBase64}
                              alt="Signature"
                              className="max-h-20 mx-auto object-contain"
                            />
                            <p className="text-[11px] font-medium text-emerald-700">
                              Signature uploaded
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-2">
                            <FileSignature className="w-8 h-8 mx-auto text-cream-400" />
                            <p className="text-xs text-navy-500 font-medium">No signature uploaded</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => signatureInputRef.current?.click()}
                          className="btn-secondary flex-1 py-1.5 px-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {brandingData.signatureBase64 ? "Change" : "Upload Signature"}
                        </button>
                        {brandingData.signatureBase64 && (
                          <button
                            type="button"
                            onClick={() => handleBrandingRemove("signature")}
                            className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                            title="Remove signature"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleBrandingUpload("signature", e)}
                        className="hidden"
                      />
                      {errors.signature && (
                        <p className="text-[11px] text-rose-600 font-medium">{errors.signature}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-navy-400 text-center">
                    PNG with transparent background recommended (max 2MB). These can be changed anytime in Settings.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Wizard Action Footer */}
          <div
            className={`flex items-center mt-8 pt-5 border-t border-cream-200/80 ${
              isReturningUser ? "justify-end" : "justify-between"
            }`}
          >
            {!isReturningUser && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs text-navy-600 hover:text-navy-950 hover:bg-cream-100 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentStepIndex === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                className="btn-primary px-6 py-2.5 text-xs font-bold shadow-soft hover:shadow-floating active:scale-95 flex items-center gap-2"
              >
                <span>{isReturningUser ? "Save & Go to Dashboard" : "Finish Setup & Launch"}</span>
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary px-6 py-2.5 text-xs font-bold shadow-soft hover:shadow-floating active:scale-95 flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center mt-6">
          <p className="text-xs text-navy-400">
            Trippr Commercial Transport Hub &bull; Crafted by{" "}
            <a
              href="https://github.com/tanishqmudaliar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-saffron-600 hover:underline"
            >
              Tanishq Mudaliar
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
