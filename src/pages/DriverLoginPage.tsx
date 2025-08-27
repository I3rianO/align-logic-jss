import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useDriverStore from '@/store/driverStore';
import { Loader2, Key, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getDriverPin, setDriverPin } from "@/utils/driverPass";

const SECURITY_QUESTIONS = [
  "What was your childhood nickname?",
  "In what city were you born?",
  "What is the name of your first pet?",
  "What is your mother's maiden name?",
  "What high school did you attend?",
  "What was your favorite food as a child?",
  "What was the make of your first car?",
  "What was your favorite place to visit as a child?",
  "What is your oldest sibling's middle name?",
  "What was the street you lived on in third grade?"
];

function DriverLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    drivers,
    validateDriverCredentials,
    setDriverPassword,
    setDriverSecurityQuestions,
    validateSecurityAnswers,
    getDriverSecurityQuestions,
    logDriverActivity
  } = useDriverStore();

  const employeeId = location.state?.employeeId as string | undefined;
  const siteId = location.state?.siteId as string | undefined;
  const siteName = location.state?.siteName as string | undefined;
  const companyId = location.state?.companyId as string | undefined;

  const driver = drivers.find(d => d.employeeId === employeeId);

  const siteInfo = useMemo(() => {
    if (siteName && siteId) return { name: siteName, id: siteId };
    return driver ? { name: 'Your Facility', id: driver.siteId } : null;
  }, [driver, siteId, siteName]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);

  const [question1, setQuestion1] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer2, setAnswer2] = useState('');

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetAnswer1, setResetAnswer1] = useState('');
  const [resetAnswer2, setResetAnswer2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState<{ question1: string, question2: string } | null>(null);

  useEffect(() => {
    if (!employeeId) {
      navigate('/');
      return;
    }

    // ✅ First-time driver → show password setup
    const existingPin = getDriverPin(employeeId);
    if (!existingPin) {
      setShowPasswordSetup(true);
    } else {
      setShowPasswordSetup(false);
    }

    // ❌ Don’t auto-show security questions here.
    // Security questions only show AFTER successful login or password setup.

    // For forgot-password flow, hydrate questions
    if (isForgotPassword && driver?.securityQuestionsSet) {
      const qs = getDriverSecurityQuestions(employeeId);
      if (qs) setSecurityQuestions(qs);
    }
  }, [employeeId, driver, navigate, isForgotPassword, getDriverSecurityQuestions]);

  const handleLogin = () => {
    if (!password) {
      toast({ title: "Error", description: "Please enter your password", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const isValid = validateDriverCredentials(employeeId!, password);

      if (!isValid) {
        toast({ title: "Authentication Failed", description: "Incorrect password. Please try again.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (driver) {
        logDriverActivity({
          driverId: employeeId!,
          driverName: driver.name,
          action: 'login',
          details: 'Successfully logged in'
        });
      }

      if (driver && !driver.securityQuestionsSet) {
        setShowSecurityQuestions(true);
        setIsLoading(false);
        return;
      }

      navigate('/driver-preferences', {
        state: {
          employeeId,
          authenticated: true,
          siteId: siteId || driver?.siteId,
          siteName,
          companyId: companyId || driver?.companyId
        }
      });
    }, 600);
  };

  const handlePasswordSetup = () => {
    if (!password || !confirmPassword) {
      toast({ title: "Error", description: "Please enter and confirm your password", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setDriverPassword(employeeId!, password);
      setDriverPin(employeeId!, password);

      setIsLoading(false);
      setShowPasswordSetup(false);

      if (driver && !driver.securityQuestionsSet) {
        setShowSecurityQuestions(true);
      } else {
        navigate('/driver-preferences', {
          state: {
            employeeId,
            authenticated: true,
            siteId: siteId || driver?.siteId,
            siteName,
            companyId: companyId || driver?.companyId
          }
        });
      }

      toast({ title: "Password Set", description: "Your password has been set successfully." });
    }, 600);
  };

  const handleSecurityQuestionsSetup = () => {
    if (!question1 || !answer1 || !question2 || !answer2) {
      toast({ title: "Error", description: "Please select both questions and provide answers", variant: "destructive" });
      return;
    }
    if (question1 === question2) {
      toast({ title: "Error", description: "Please select two different security questions", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setDriverSecurityQuestions(employeeId!, { question1, answer1, question2, answer2 });
      setIsLoading(false);
      setShowSecurityQuestions(false);

      toast({ title: "Security Questions Set", description: "Your security questions have been saved." });

      navigate('/driver-preferences', {
        state: { employeeId, authenticated: true, siteId: siteId || driver?.siteId, siteName, companyId: companyId || driver?.companyId }
      });
    }, 600);
  };

  const handlePasswordReset = () => {
    if (!resetAnswer1 || !resetAnswer2) {
      toast({ title: "Error", description: "Please answer both security questions", variant: "destructive" });
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      toast({ title: "Error", description: "Please enter and confirm your new password", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const ok = validateSecurityAnswers(employeeId!, { answer1: resetAnswer1, answer2: resetAnswer2 });
      if (!ok) {
        toast({ title: "Incorrect Answers", description: "Security answers are incorrect.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      setDriverPassword(employeeId!, newPassword);
      setDriverPin(employeeId!, newPassword);

      setIsLoading(false);
      setIsForgotPassword(false);

      toast({ title: "Password Reset Successful", description: "You can now log in with your new password." });
    }, 600);
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setResetAnswer1('');
    setResetAnswer2('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // --- RENDERS ---

  if (showPasswordSetup) { /* Password setup */ ... }
  else if (showSecurityQuestions) { /* Security setup */ ... }
  else if (isForgotPassword) { /* Forgot password */ ... }
  else { /* Normal login */ ... }
}

export default DriverLoginPage;
