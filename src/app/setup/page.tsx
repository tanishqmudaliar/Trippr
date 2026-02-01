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
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  FileSignature,
  Upload,
  X,
} from "lucide-react";
import {
  saveAsset,
  fileToBase64,
  validateImageFile,
  type AssetKey,
} from "@/lib/assetStorage";

type Step =
  | "company"
  | "profile"
  | "vehicle"
  | "client"
  | "branding"
  | "backup";

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
  { id: "backup", label: "Backup", icon: Shield },
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
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

  const [backupData, setBackupData] = useState({
    enableBackup: false,
    encryptionKey: "",
  });

  // Redirect if setup AND branding are both complete
  useEffect(() => {
    if (isSetupComplete && isBrandingComplete) {
      router.replace("/");
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
      case "backup":
        if (backupData.enableBackup && !backupData.encryptionKey.trim()) {
          newErrors.encryptionKey =
            "Encryption key is required when backup is enabled";
        }
        if (backupData.enableBackup && backupData.encryptionKey.length < 8) {
          newErrors.encryptionKey =
            "Encryption key must be at least 8 characters";
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

      // Restore the data
      restoreFromBackup({
        companyInfo: data.companyInfo,
        userProfile: data.userProfile,
        vehicles: data.vehicles,
        clients: data.clients,
        entries: data.entries || [],
        invoices: data.invoices || [],
        backupConfig: data.backupConfig || null,
      });

      // Redirect to home
      router.replace("/");
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
    if (!validateStep("backup")) return;

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
      router.replace("/");
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
      backupConfig: backupData.enableBackup
        ? {
            enabled: true,
            googleEmail: null,
            lastBackupAt: null,
            autoBackup: true,
          }
        : undefined,
    });

    router.replace("/");
  };

  // Handle Enter key to move to next field or next step
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, isLastField: boolean) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isLastField) {
          // If on last step, complete setup; otherwise go to next step
          if (currentStepIndex === steps.length - 1) {
            handleComplete();
          } else {
            handleNext();
          }
        } else {
          // Move to next input field
          const form = e.currentTarget.closest(".space-y-5");
          if (form) {
            const inputs = Array.from(form.querySelectorAll("input"));
            const currentIndex = inputs.indexOf(e.currentTarget);
            const nextInput = inputs[currentIndex + 1];
            if (nextInput) {
              nextInput.focus();
            }
          }
        }
      }
    },
    [currentStepIndex, handleComplete, handleNext],
  );

  // Don't render anything while checking setup status (only if fully complete)
  if (isSetupComplete && isBrandingComplete) {
    return null;
  }

  // Welcome screen - choose between restore or fresh setup
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <style jsx>{`
            @font-face {
              font-family: "LogoFont";
              src: url("/fonts/logo.ttf") format("truetype");
              font-weight: normal;
              font-style: normal;
            }
          `}</style>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="mx-auto mb-4"
            >
              <span
                style={{
                  fontFamily: "LogoFont, serif",
                  fontSize: "3rem",
                  color: "#f97316",
                  borderTop: "3px solid #f97316",
                  borderBottom: "3px solid #f97316",
                  padding: "0 30px",
                  display: "inline-block",
                }}
              >
                Trippr
              </span>
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">
              Welcome to Your Travel Manager
            </h1>
            <p className="text-navy-600">Get started with your journey</p>
          </div>

          <div className="card p-6 lg:p-8 space-y-4">
            <h2 className="font-display text-xl font-semibold text-navy-900 text-center mb-2">
              How would you like to start?
            </h2>

            {/* Restore from Backup Option */}
            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 hover:border-saffron-300 transition-all">
              <h3 className="font-medium text-navy-800 mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-saffron-500" />
                Restore from Backup
              </h3>
              <p className="text-sm text-navy-600 mb-3">
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
                className="w-full px-4 py-2.5 rounded-lg bg-saffron-500 text-white font-medium hover:bg-saffron-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {restoreError}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cream-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-navy-400">or</span>
              </div>
            </div>

            {/* Fresh Setup Option */}
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full p-4 rounded-xl border-2 border-cream-200 hover:border-saffron-300 hover:bg-cream-50 transition-all text-left"
            >
              <h3 className="font-medium text-navy-800 mb-1 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-saffron-500" />
                Start Fresh
              </h3>
              <p className="text-sm text-navy-600">
                Set up your account from scratch with a step-by-step guide.
              </p>
            </button>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8 pb-4"
          >
            <p className="text-sm text-navy-600">
              Made with <span className="text-red-500 animate-pulse">❤️</span>{" "}
              by{" "}
              <a
                href="https://github.com/tanishqmudaliar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors"
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
    <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
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
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4"
          >
            <span
              style={{
                fontFamily: "LogoFont, serif",
                fontSize: "3rem",
                color: "#f97316",
                borderTop: "3px solid #f97316",
                borderBottom: "3px solid #f97316",
                padding: "0 30px",
                display: "inline-block",
              }}
            >
              Trippr
            </span>
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">
            {isReturningUser
              ? "Complete Your Setup"
              : "Welcome to Your Travel Manager"}
          </h1>
          <p className="text-navy-600">
            {isReturningUser
              ? "Please upload your company logo and signature to continue"
              : "Let's set up your account in a few easy steps"}
          </p>
        </div>

        {/* Progress Steps - hide for returning users with single step */}
        {!isReturningUser && (
          <div className="flex justify-between mb-8 px-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-saffron-500 text-white shadow-lg shadow-saffron-500/30"
                          : "bg-cream-200 text-navy-400"
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive ? "text-saffron-600" : "text-navy-400"
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
        <div className="card p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Company Step */}
              {currentStep === "company" && (
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-bold text-navy-900">
                      Company Information
                    </h2>
                    <p className="text-sm text-navy-500 mt-1">
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
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-bold text-navy-900">
                      Your Profile
                    </h2>
                    <p className="text-sm text-navy-500 mt-1">
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
                  <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
                    <p className="text-sm text-navy-600">
                      <span className="font-medium">Time Format:</span> 24-hour
                      format (can be changed in Settings)
                    </p>
                  </div>
                </div>
              )}

              {/* Vehicle Step */}
              {currentStep === "vehicle" && (
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-bold text-navy-900">
                      Your First Vehicle
                    </h2>
                    <p className="text-sm text-navy-500 mt-1">
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
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-bold text-navy-900">
                      Your First Client
                    </h2>
                    <p className="text-sm text-navy-500 mt-1">
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-bold text-navy-900">
                      Logo & Signature
                    </h2>
                    <p className="text-sm text-navy-500 mt-1">
                      Add your company branding for invoices (optional)
                    </p>
                  </div>

                  {brandingError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {brandingError}
                      <button
                        onClick={() => setBrandingError(null)}
                        className="ml-auto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Company Logo */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-navy-700">
                        Company Logo
                      </label>
                      <div className="border-2 border-dashed border-cream-300 rounded-xl p-4 text-center min-h-40 flex flex-col items-center justify-center">
                        {brandingData.logoBase64 ? (
                          <div className="space-y-3">
                            <img
                              src={brandingData.logoBase64}
                              alt="Company Logo"
                              className="max-h-20 mx-auto object-contain"
                            />
                            <p className="text-xs text-navy-500">
                              Logo uploaded
                            </p>
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="btn-secondary text-xs py-1.5 px-3"
                              >
                                <Upload className="w-3 h-3" />
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBrandingRemove("logo")}
                                className="text-xs py-1.5 px-3 rounded-lg text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <ImageIcon className="w-10 h-10 mx-auto text-cream-400" />
                            <p className="text-sm text-navy-500">
                              No logo uploaded
                            </p>
                            <button
                              type="button"
                              onClick={() => logoInputRef.current?.click()}
                              className="btn-secondary text-sm py-2"
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
                      <label className="block text-sm font-medium text-navy-700">
                        Signature
                      </label>
                      <div className="border-2 border-dashed border-cream-300 rounded-xl p-4 text-center min-h-40 flex flex-col items-center justify-center">
                        {brandingData.signatureBase64 ? (
                          <div className="space-y-3">
                            <img
                              src={brandingData.signatureBase64}
                              alt="Signature"
                              className="max-h-20 mx-auto object-contain"
                            />
                            <p className="text-xs text-navy-500">
                              Signature uploaded
                            </p>
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  signatureInputRef.current?.click()
                                }
                                className="btn-secondary text-xs py-1.5 px-3"
                              >
                                <Upload className="w-3 h-3" />
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleBrandingRemove("signature")
                                }
                                className="text-xs py-1.5 px-3 rounded-lg text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <FileSignature className="w-10 h-10 mx-auto text-cream-400" />
                            <p className="text-sm text-navy-500">
                              No signature uploaded
                            </p>
                            <button
                              type="button"
                              onClick={() => signatureInputRef.current?.click()}
                              className="btn-secondary text-sm py-2"
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

                  <div className="p-4 bg-cream-100 rounded-xl space-y-1">
                    <p className="text-sm text-navy-600">
                      <strong>Note:</strong> This step is required. You can
                      always update these later in Settings.
                    </p>
                    <p className="text-xs text-navy-500">
                      Accepted formats: PNG, JPG, JPEG (max 2MB). PNG is
                      recommended for best quality.
                    </p>
                  </div>
                </div>
              )}

              {/* Backup Step */}
              {currentStep === "backup" && (
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-bold text-navy-900">
                      Backup & Security
                    </h2>
                    <p className="text-sm text-navy-500 mt-1">
                      Protect your data with cloud backup (optional)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-cream-200 hover:border-saffron-300 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="backupOption"
                        checked={!backupData.enableBackup}
                        onChange={() =>
                          setBackupData({ ...backupData, enableBackup: false })
                        }
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-navy-900">
                          Skip for now
                        </p>
                        <p className="text-sm text-navy-500">
                          Use local storage only (data stays on this device)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-cream-200 hover:border-saffron-300 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="backupOption"
                        checked={backupData.enableBackup}
                        onChange={() =>
                          setBackupData({ ...backupData, enableBackup: true })
                        }
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-navy-900">
                          Enable Google Drive Backup
                        </p>
                        <p className="text-sm text-navy-500">
                          Encrypted cloud backup synced across devices
                        </p>
                      </div>
                    </label>
                  </div>

                  {backupData.enableBackup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 pt-4"
                    >
                      <InputField
                        label="Encryption Key"
                        name="encryptionKey"
                        type="password"
                        value={backupData.encryptionKey}
                        onChange={(e) =>
                          setBackupData({
                            ...backupData,
                            encryptionKey: e.target.value,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, true)}
                        placeholder="Minimum 8 characters"
                        error={errors.encryptionKey}
                      />
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-800">
                          <strong>Important:</strong> Remember this key!
                          It&apos;s used to encrypt your data. Without it, you
                          won&apos;t be able to restore your backup.
                        </p>
                      </div>
                      <p className="text-sm text-navy-500">
                        You&apos;ll connect your Google account after setup from
                        the Settings page.
                      </p>
                    </motion.div>
                  )}

                  <div className="pt-4 border-t border-cream-200">
                    <button
                      onClick={() => setIsRecoveryMode(true)}
                      className="flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Recover Existing Data
                    </button>
                    <p className="text-xs text-navy-500 mt-1">
                      Have an existing backup? Restore it here.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div
            className={`flex mt-8 pt-6 border-t border-cream-200 ${isReturningUser ? "justify-end" : "justify-between"}`}
          >
            {!isReturningUser && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-navy-600 hover:bg-cream-100"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            )}

            {currentStepIndex === steps.length - 1 ? (
              <button onClick={handleComplete} className="btn-primary">
                {isReturningUser ? "Save & Continue" : "Complete Setup"}
                <Check className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary">
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Recovery Mode Modal */}
        <AnimatePresence>
          {isRecoveryMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsRecoveryMode(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-xl font-bold text-navy-900 mb-4">
                  Recover Existing Data
                </h3>
                <p className="text-navy-600 mb-6">
                  Restore your data from a local backup file or connect Google
                  Drive.
                </p>

                {/* Local Backup Restore */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                    <h4 className="font-medium text-navy-800 mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-saffron-500" />
                      Local Backup
                    </h4>
                    <p className="text-sm text-navy-600 mb-3">
                      Upload a .json backup file exported from Settings.
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
                      className="w-full px-4 py-2 rounded-lg bg-saffron-500 text-white font-medium hover:bg-saffron-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                      <p className="text-sm text-red-600 mt-2">
                        {restoreError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Google Drive Option */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-cream-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-navy-400">or</span>
                    </div>
                  </div>
                  <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-cream-200 hover:border-saffron-300 hover:bg-cream-50 transition-all font-medium text-navy-700">
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
                  </button>
                  <p className="text-sm text-navy-500 text-center">
                    Google Drive integration will be available soon.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-cream-200 flex justify-end gap-3">
                  <button
                    onClick={() => setIsRecoveryMode(false)}
                    className="px-4 py-2 rounded-xl text-navy-600 hover:bg-cream-100 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 pb-4"
        >
          <p className="text-sm text-navy-600">
            Made with <span className="text-red-500 animate-pulse">❤️</span> by{" "}
            <a
              href="https://github.com/tanishqmudaliar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors"
            >
              Tanishq Mudaliar
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
