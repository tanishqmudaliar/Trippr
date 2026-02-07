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

// InputField component defined OUTSIDE of SetupPage to prevent re-creation on every render
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
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-navy-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`input-field ${
          error ? "border-red-400 focus:ring-red-500" : ""
        }`}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

const allSteps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "vehicle", label: "Vehicle", icon: Car },
  { id: "client", label: "Client", icon: Users },
  { id: "branding", label: "Branding", icon: ImageIcon },
];

// Simpler steps for returning users who only need to add branding
const brandingOnlySteps: {
  id: Step;
  label: string;
  icon: React.ElementType;
}[] = [{ id: "branding", label: "Branding", icon: ImageIcon }];

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

  // Determine if this is a returning user who just needs branding
  const isReturningUser = isSetupComplete && !isBrandingComplete;

  // Use simpler steps for returning users
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

  // Form data - pre-populate with existing data for returning users
  const [companyData, setCompanyData] = useState({
    companyName: companyInfo?.companyName || "",
    businessContact: companyInfo?.businessContact || "",
    businessEmail: companyInfo?.businessEmail || "",
    address: companyInfo?.address || "",
  });

  const [profileData, setProfileData] = useState({
    firstName: userProfile?.firstName || "",
    lastName: userProfile?.lastName || "",
  });

  const [vehicleData, setVehicleData] = useState({
    numberPlate: vehicles[0]?.numberPlate || "",
    model: vehicles[0]?.model || "",
  });

  const firstClient = clients[0];
  const [clientData, setClientData] = useState({
    name: firstClient?.name || "",
    baseKmsPerDay: firstClient?.baseKmsPerDay?.toString() || "",
    baseHoursPerDay: firstClient?.baseHoursPerDay?.toString() || "",
    perDayRate: firstClient?.perDayRate?.toString() || "",
    extraKmRate: firstClient?.extraKmRate?.toString() || "",
    extraHourRate: firstClient?.extraHourRate?.toString() || "",
    serviceTaxPercent: firstClient?.serviceTaxPercent?.toString() || "",
  });

  // Branding state (optional - for logo and signature)
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

  // Redirect if setup AND branding are both complete
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
          newErrors.businessContact = "Contact number is required";
        else if (!/^\d{10,15}$/.test(companyData.businessContact.trim()))
          newErrors.businessContact =
            "Enter a valid contact number (10-15 digits)";
        if (!companyData.businessEmail.trim())
          newErrors.businessEmail = "Email is required";
        else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.businessEmail.trim())
        )
          newErrors.businessEmail = "Enter a valid email address";
        if (!companyData.address.trim())
          newErrors.address = "Address is required";
        break;
      case "profile":
        if (!profileData.firstName.trim())
          newErrors.firstName = "First name is required";
        if (!profileData.lastName.trim())
          newErrors.lastName = "Last name is required";
        break;
      case "vehicle":
        if (!vehicleData.numberPlate.trim())
          newErrors.numberPlate = "Number plate is required";
        if (!vehicleData.model.trim())
          newErrors.model = "Vehicle model is required";
        break;
      case "client":
        if (!clientData.name.trim()) newErrors.name = "Client name is required";
        if (!clientData.baseKmsPerDay)
          newErrors.baseKmsPerDay = "Base KMs/Day is required";
        else if (Number(clientData.baseKmsPerDay) <= 0)
          newErrors.baseKmsPerDay = "Must be greater than 0";
        if (!clientData.baseHoursPerDay)
          newErrors.baseHoursPerDay = "Base Hours/Day is required";
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
        // Logo and signature are now required
        if (!brandingData.logoBase64) {
          newErrors.logo = "Company logo is required";
        }
        if (!brandingData.signatureBase64) {
          newErrors.signature = "Signature is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle branding file upload
  const handleBrandingUpload = async (
    type: AssetKey,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setBrandingError(validation.error || "Invalid file");
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

  // Remove branding asset
  const handleBrandingRemove = (type: AssetKey) => {
    if (type === "logo") {
      setBrandingData((prev) => ({ ...prev, logoBase64: null }));
    } else {
      setBrandingData((prev) => ({ ...prev, signatureBase64: null }));
    }
  };

  // Handle local backup restore
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

      // Validate the backup data structure
      if (
        !data.companyInfo ||
        !data.userProfile ||
        !data.vehicles ||
        !data.clients
      ) {
        throw new Error("Invalid backup file format");
      }

      // Check if backup includes logo and signature
      const hasLogo = !!data.logoBase64;
      const hasSignature = !!data.signatureBase64;
      const hasBothAssets = hasLogo && hasSignature;

      // Save assets to IndexedDB if they exist in backup
      if (hasLogo) {
        await saveAsset("logo", data.logoBase64);
      }
      if (hasSignature) {
        await saveAsset("signature", data.signatureBase64);
      }

      // Restore the data
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

      // Redirect to home
      router.replace("/dashboard");
    } catch (err) {
      console.error("Restore error:", err);
      setRestoreError(
        err instanceof Error ? err.message : "Failed to restore backup",
      );
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  };

  // Handle cloud backup restore
  const handleRestoreFromCloud = async () => {
    setCloudError(null);
    setIsCloudRestoring(true);

    try {
      // Authenticate with Google
      const auth: GoogleAuthState = await authenticateWithGoogle();

      if (!isTokenValid(auth)) {
        throw new Error("Authentication failed");
      }

      // Download cloud data
      const cloudData = await downloadSyncData(auth.accessToken);

      if (!cloudData) {
        throw new Error(
          "No cloud backup found. Please use local backup or start fresh.",
        );
      }

      // Validate the backup data structure
      if (
        !cloudData.companyInfo ||
        !cloudData.userProfile ||
        !cloudData.vehicles ||
        !cloudData.clients
      ) {
        throw new Error("Invalid cloud backup format");
      }

      // Check if backup includes logo and signature
      const hasLogo = !!cloudData.logoBase64;
      const hasSignature = !!cloudData.signatureBase64;
      const hasBothAssets = hasLogo && hasSignature;

      // Save assets to IndexedDB if they exist in backup
      if (hasLogo) {
        await saveAsset("logo", cloudData.logoBase64 as string);
      }
      if (hasSignature) {
        await saveAsset("signature", cloudData.signatureBase64 as string);
      }

      // Restore the data
      restoreFromBackup({
        companyInfo: cloudData.companyInfo as Parameters<
          typeof restoreFromBackup
        >[0]["companyInfo"],
        userProfile: cloudData.userProfile as Parameters<
          typeof restoreFromBackup
        >[0]["userProfile"],
        vehicles: cloudData.vehicles as Parameters<
          typeof restoreFromBackup
        >[0]["vehicles"],
        clients: cloudData.clients as Parameters<
          typeof restoreFromBackup
        >[0]["clients"],
        entries: (cloudData.entries || []) as Parameters<
          typeof restoreFromBackup
        >[0]["entries"],
        invoices: (cloudData.invoices || []) as Parameters<
          typeof restoreFromBackup
        >[0]["invoices"],
        backupConfig: cloudData.backupConfig as Parameters<
          typeof restoreFromBackup
        >[0]["backupConfig"],
        isBrandingComplete: hasBothAssets,
      });

      // Save Google auth to localStorage for future syncs
      localStorage.setItem("trippr-google-auth", JSON.stringify(auth));

      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (err) {
      console.error("Cloud restore error:", err);
      setCloudError(
        err instanceof Error ? err.message : "Failed to restore from cloud",
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
      // Go back to welcome screen
      setShowWelcome(true);
    }
  };

  const handleComplete = async () => {
    if (!validateStep("branding")) return;

    // Save branding assets to IndexedDB (required)
    if (brandingData.logoBase64) {
      await saveAsset("logo", brandingData.logoBase64);
    }
    if (brandingData.signatureBase64) {
      await saveAsset("signature", brandingData.signatureBase64);
    }

    // If returning user just completing branding, mark branding complete and redirect
    if (isReturningUser) {
      markBrandingComplete();
      router.replace("/dashboard");
      return;
    }

    // New user - complete full setup
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
        timeFormat: "24hr",
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
        perDayRate: Number(clientData.perDayRate) || 0,
        extraKmRate: Number(clientData.extraKmRate) || 0,
        extraHourRate: Number(clientData.extraHourRate) || 0,
        serviceTaxPercent: Number(clientData.serviceTaxPercent) || 0,
        createdAt: new Date().toISOString(),
      },
    });

    router.replace("/dashboard");
  };

  // Handle Enter key to move to next field or next step
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, isLastField: boolean) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isLastField) {
          // Validate current step first
          if (!validateStep(currentStep)) {
            return; // Stop if validation fails
          }

          // If on last step, complete setup; otherwise go to next step
          if (currentStepIndex === steps.length - 1) {
            handleComplete();
          } else {
            handleNext();
          }
        } else {
          // Move to next input field
          const form = e.currentTarget.closest(".space-y-6");
          if (form) {
            const inputs = Array.from(
              form.querySelectorAll("input:not([type='file'])"),
            );
            const currentIndex = inputs.indexOf(e.currentTarget);
            const nextInput = inputs[currentIndex + 1] as
              | HTMLInputElement
              | undefined;
            if (nextInput) {
              nextInput.focus();
            }
          }
        }
      }
    },
    [
      currentStepIndex,
      currentStep,
      handleComplete,
      handleNext,
      steps.length,
      validateStep,
    ],
  );

  // Don't render anything while checking setup status (only if fully complete)
  if (isSetupComplete && isBrandingComplete) {
    return null;
  }

  // Welcome screen - choose between restore or fresh setup
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <style jsx>{`
            @font-face {
              font-family: "LogoFont";
              src: url("/fonts/logo.ttf") format("truetype");
              font-weight: normal;
              font-style: normal;
            }
          `}</style>

          {/* Header */}
          <style jsx>{`
            @font-face {
              font-family: "LogoFont";
              src: url("/fonts/logo.ttf") format("truetype");
              font-weight: normal;
              font-style: normal;
            }
          `}</style>
          <div className="text-center pt-8 lg:pt-4 pb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mx-auto mb-6"
            >
              <span
                style={{
                  fontFamily: "LogoFont, serif",
                  fontSize: "3.5rem",
                  color: "#f97316",
                  borderTop: "3.5px solid #f97316",
                  borderBottom: "3.5px solid #f97316",
                  padding: "8px 48px",
                  display: "inline-block",
                  letterSpacing: "0.02em",
                }}
              >
                Trippr
              </span>
            </motion.div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 mb-3 leading-tight">
              Welcome to Your Travel Manager
            </h1>
            <p className="text-base sm:text-lg text-navy-600">
              Get started with your journey
            </p>
          </div>

          {/* Main Card */}
          <div className="card p-6 sm:p-8 lg:p-10 space-y-6 shadow-lg">
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy-900 text-center mb-6 lg:-mt-3">
              How would you like to start?
            </h2>

            {/* Fresh Setup Option */}
            <button
              onClick={() => setShowWelcome(false)}
              className="group w-full p-5 rounded-xl border-2 border-cream-200 hover:border-saffron-400 hover:bg-cream-50 hover:shadow-md active:scale-[0.99] transition-all duration-300 text-left"
            >
              <h3 className="font-semibold text-navy-800 mb-2 flex items-center gap-2.5">
                <RefreshCw className="w-5 h-5 text-saffron-500 group-hover:rotate-180 transition-transform duration-500" />
                Start Fresh
              </h3>
              <p className="text-sm text-navy-600 leading-relaxed">
                Set up your account from scratch with a step-by-step guide.
              </p>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-cream-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 py-1 bg-white text-navy-500 font-medium">
                  or
                </span>
              </div>
            </div>

            {/* Cloud Sync Option */}
            <div className="group p-5 rounded-xl bg-cream-50 border-2 border-cream-200 hover:border-saffron-400 hover:shadow-md transition-all duration-300">
              <h3 className="font-semibold text-navy-800 mb-2.5 flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-saffron-500 group-hover:scale-110 transition-transform" />
                Restore from Cloud
              </h3>
              <p className="text-sm text-navy-600 mb-4 leading-relaxed">
                Connect to Google Drive to restore your backup from the cloud.
              </p>
              <button
                onClick={handleRestoreFromCloud}
                disabled={isCloudRestoring}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white border-2 border-cream-300 hover:border-saffron-400 hover:bg-cream-50 active:scale-[0.98] transition-all duration-200 font-semibold text-navy-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isCloudRestoring ? (
                  <>
                    <div className="w-5 h-5 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    Connect Google Account
                  </>
                )}
              </button>
              {cloudError && (
                <p className="text-sm text-red-600 mt-3 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {cloudError}
                </p>
              )}
            </div>

            {/* Local Backup Option */}
            <div className="group p-5 rounded-xl bg-cream-50 border-2 border-cream-200 hover:border-saffron-400 hover:shadow-md transition-all duration-300">
              <h3 className="font-semibold text-navy-800 mb-2.5 flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-saffron-500 group-hover:scale-110 transition-transform" />
                Restore from Local Backup
              </h3>
              <p className="text-sm text-navy-600 mb-4 leading-relaxed">
                Upload a .json backup file exported from Settings to restore all
                your data.
              </p>
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
                className="w-full px-4 py-3 rounded-lg bg-saffron-500 text-white font-semibold hover:bg-saffron-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                {isRestoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Choose Backup File
                  </>
                )}
              </button>
              {restoreError && (
                <p className="text-sm text-red-600 mt-3 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {restoreError}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center mt-10 pb-6"
          >
            <p className="text-sm sm:text-base text-navy-600">
              Made with{" "}
              <span className="text-red-500 inline-block animate-pulse">
                ❤️
              </span>{" "}
              by{" "}
              <a
                href="https://github.com/tanishqmudaliar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors underline-offset-2"
              >
                Tanishq Mudaliar
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <style jsx>{`
          @font-face {
            font-family: "LogoFont";
            src: url("/fonts/logo.ttf") format("truetype");
            font-weight: normal;
            font-style: normal;
          }
        `}</style>
        <div className="text-center pt-4 pb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mb-6"
          >
            <span
              style={{
                fontFamily: "LogoFont, serif",
                fontSize: "3.5rem",
                color: "#f97316",
                borderTop: "3.5px solid #f97316",
                borderBottom: "3.5px solid #f97316",
                padding: "8px 48px",
                display: "inline-block",
                letterSpacing: "0.02em",
              }}
            >
              Trippr
            </span>
          </motion.div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 mb-3 leading-tight">
            {isReturningUser
              ? "Complete Your Setup"
              : "Welcome to Your Travel Manager"}
          </h1>
          <p className="text-base sm:text-lg text-navy-600">
            {isReturningUser
              ? "Please upload your company logo and signature to continue"
              : "Let's set up your account in a few easy steps"}
          </p>
        </div>

        {/* Progress Steps - hide for returning users with single step */}
        {!isReturningUser && (
          <div className="flex justify-between mb-10 px-4 sm:px-8">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center flex-1 max-w-30"
                >
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-md"
                        : isActive
                          ? "bg-saffron-500 text-white shadow-lg shadow-saffron-500/40"
                          : "bg-cream-200 text-navy-400"
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs sm:text-sm mt-3 font-semibold text-center leading-tight ${
                      isActive
                        ? "text-saffron-600"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-navy-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Form Card */}
        <div className="card p-6 sm:p-8 lg:p-10 shadow-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Company Step */}
              {currentStep === "company" && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-bold text-navy-900">
                      Company Information
                    </h2>
                    <p className="text-sm sm:text-base text-navy-500 mt-2">
                      Enter your company details for invoices
                    </p>
                  </div>
                  <InputField
                    label="Company Name"
                    name="companyName"
                    value={companyData.companyName}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        companyName: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g., Your Company Name"
                    error={errors.companyName}
                  />
                  <InputField
                    label="Business Contact"
                    name="businessContact"
                    type="number"
                    value={companyData.businessContact}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        businessContact: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g., 9876543210"
                    error={errors.businessContact}
                  />
                  <InputField
                    label="Business Email"
                    name="businessEmail"
                    type="email"
                    value={companyData.businessEmail}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        businessEmail: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g., contact@company.com"
                    error={errors.businessEmail}
                  />
                  <InputField
                    label="Address"
                    name="address"
                    value={companyData.address}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        address: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    placeholder="e.g., 123 Main St, City, Country"
                    error={errors.address}
                  />
                </div>
              )}

              {/* Profile Step */}
              {currentStep === "profile" && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-bold text-navy-900">
                      Your Profile
                    </h2>
                    <p className="text-sm sm:text-base text-navy-500 mt-2">
                      Your personal information
                    </p>
                  </div>
                  <InputField
                    label="First Name"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g., Tanishq"
                    error={errors.firstName}
                  />
                  <InputField
                    label="Last Name"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    placeholder="e.g., Mudaliar"
                    error={errors.lastName}
                  />
                  <div className="p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                    <p className="text-sm sm:text-base text-navy-600 leading-relaxed">
                      <span className="font-semibold">Time Format:</span>{" "}
                      24-hour format (can be changed in Settings)
                    </p>
                  </div>
                </div>
              )}

              {/* Vehicle Step */}
              {currentStep === "vehicle" && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-bold text-navy-900">
                      Your First Vehicle
                    </h2>
                    <p className="text-sm sm:text-base text-navy-500 mt-2">
                      Add your primary vehicle (you can add more later)
                    </p>
                  </div>
                  <InputField
                    label="Number Plate"
                    name="numberPlate"
                    value={vehicleData.numberPlate}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        numberPlate: e.target.value.toUpperCase(),
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g., MH-01-AB-1234"
                    error={errors.numberPlate}
                  />
                  <InputField
                    label="Vehicle Model"
                    name="model"
                    value={vehicleData.model}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, model: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    placeholder="e.g., Maruti Suzuki Swift Dzire"
                    error={errors.model}
                  />
                </div>
              )}

              {/* Client Step */}
              {currentStep === "client" && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-bold text-navy-900">
                      Your First Client
                    </h2>
                    <p className="text-sm sm:text-base text-navy-500 mt-2">
                      Set up your first client with their rates
                    </p>
                  </div>
                  <InputField
                    label="Client Name"
                    name="name"
                    value={clientData.name}
                    onChange={(e) =>
                      setClientData({ ...clientData, name: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g., XYZ Corporation"
                    error={errors.name}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InputField
                      label="Base KMs/Day"
                      name="baseKmsPerDay"
                      type="number"
                      placeholder="e.g., 80"
                      value={clientData.baseKmsPerDay}
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          baseKmsPerDay: e.target.value,
                        })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      error={errors.baseKmsPerDay}
                    />
                    <InputField
                      label="Base Hours/Day"
                      name="baseHoursPerDay"
                      type="number"
                      placeholder="e.g., 8"
                      value={clientData.baseHoursPerDay}
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          baseHoursPerDay: e.target.value,
                        })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      error={errors.baseHoursPerDay}
                    />
                  </div>
                  <InputField
                    label="Per Day Rate (₹)"
                    name="perDayRate"
                    type="number"
                    value={clientData.perDayRate}
                    onChange={(e) =>
                      setClientData({
                        ...clientData,
                        perDayRate: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder="e.g., 1500"
                    error={errors.perDayRate}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InputField
                      label="Extra KM Rate (₹)"
                      name="extraKmRate"
                      type="number"
                      value={clientData.extraKmRate}
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          extraKmRate: e.target.value,
                        })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="e.g., 15"
                      error={errors.extraKmRate}
                    />
                    <InputField
                      label="Extra Hour Rate (₹)"
                      name="extraHourRate"
                      type="number"
                      value={clientData.extraHourRate}
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          extraHourRate: e.target.value,
                        })
                      }
                      onKeyDown={(e) => handleKeyDown(e, false)}
                      placeholder="e.g., 150"
                      error={errors.extraHourRate}
                    />
                  </div>
                  <InputField
                    label="Service Tax %"
                    name="serviceTaxPercent"
                    type="number"
                    placeholder="e.g., 5"
                    value={clientData.serviceTaxPercent}
                    onChange={(e) =>
                      setClientData({
                        ...clientData,
                        serviceTaxPercent: e.target.value,
                      })
                    }
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    required={false}
                    error={errors.serviceTaxPercent}
                  />
                </div>
              )}

              {/* Branding Step */}
              {currentStep === "branding" && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-bold text-navy-900">
                      Logo & Signature
                    </h2>
                    <p className="text-sm sm:text-base text-navy-500 mt-2">
                      Add your company branding for invoices (optional)
                    </p>
                  </div>

                  {brandingError && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm sm:text-base flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span className="flex-1">{brandingError}</span>
                      <button
                        onClick={() => setBrandingError(null)}
                        className="ml-auto hover:bg-red-100 rounded p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    {/* Company Logo */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-navy-700">
                        Company Logo
                      </label>
                      <div className="border-2 border-dashed border-cream-300 rounded-xl p-6 text-center min-h-48 flex flex-col items-center justify-center hover:border-saffron-300 transition-colors">
                        {brandingData.logoBase64 ? (
                          <div className="space-y-4 w-full">
                            <img
                              src={brandingData.logoBase64}
                              alt="Company Logo"
                              className="max-h-24 mx-auto object-contain"
                            />
                            <p className="text-xs text-navy-500 font-medium">
                              Logo uploaded
                            </p>
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="btn-secondary text-xs sm:text-sm py-2 px-4"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBrandingRemove("logo")}
                                className="text-xs sm:text-sm py-2 px-4 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <ImageIcon className="w-12 h-12 mx-auto text-cream-400" />
                            <p className="text-sm text-navy-500 font-medium">
                              No logo uploaded
                            </p>
                            <button
                              type="button"
                              onClick={() => logoInputRef.current?.click()}
                              className="btn-secondary text-sm py-2.5 px-5"
                            >
                              <Upload className="w-4 h-4" />
                              Upload Logo
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleBrandingUpload("logo", e)}
                        className="hidden"
                      />
                    </div>

                    {/* Signature */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-navy-700">
                        Signature
                      </label>
                      <div className="border-2 border-dashed border-cream-300 rounded-xl p-6 text-center min-h-48 flex flex-col items-center justify-center hover:border-saffron-300 transition-colors">
                        {brandingData.signatureBase64 ? (
                          <div className="space-y-4 w-full">
                            <img
                              src={brandingData.signatureBase64}
                              alt="Signature"
                              className="max-h-24 mx-auto object-contain"
                            />
                            <p className="text-xs text-navy-500 font-medium">
                              Signature uploaded
                            </p>
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  signatureInputRef.current?.click()
                                }
                                className="btn-secondary text-xs sm:text-sm py-2 px-4"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleBrandingRemove("signature")
                                }
                                className="text-xs sm:text-sm py-2 px-4 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <FileSignature className="w-12 h-12 mx-auto text-cream-400" />
                            <p className="text-sm text-navy-500 font-medium">
                              No signature uploaded
                            </p>
                            <button
                              type="button"
                              onClick={() => signatureInputRef.current?.click()}
                              className="btn-secondary text-sm py-2.5 px-5"
                            >
                              <Upload className="w-4 h-4" />
                              Upload Signature
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleBrandingUpload("signature", e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="p-5 bg-cream-100 rounded-xl border-2 border-cream-200 space-y-2">
                    <p className="text-sm sm:text-base text-navy-600 leading-relaxed">
                      <strong className="font-semibold">Note:</strong> This step
                      is required. You can always update these later in
                      Settings.
                    </p>
                    <p className="text-xs sm:text-sm text-navy-500 leading-relaxed">
                      Accepted formats: PNG, JPG, JPEG (max 2MB). PNG is
                      recommended for best quality.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div
            className={`flex mt-10 pt-6 border-t-2 border-cream-200 ${isReturningUser ? "justify-end" : "justify-between"}`}
          >
            {!isReturningUser && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-navy-600 hover:bg-cream-100 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            )}

            {currentStepIndex === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                className="btn-primary px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg active:scale-95"
              >
                {isReturningUser ? "Save & Continue" : "Complete Setup"}
                <Check className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg active:scale-95"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-10 pb-6"
        >
          <p className="text-sm sm:text-base text-navy-600">
            Made with{" "}
            <span className="text-red-500 inline-block animate-pulse">❤️</span>{" "}
            by{" "}
            <a
              href="https://github.com/tanishqmudaliar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors underline-offset-2"
            >
              Tanishq Mudaliar
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
