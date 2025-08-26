import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useDriverStore from '@/store/driverStore';
import { Loader2, Key, Shield, ArrowRight, HelpCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Security questions options
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
    resetDriverPassword,
    logDriverActivity
  } = useDriverStore();

  // Get employeeId and site information from location state
  const employeeId = location.state?.employeeId;
  const siteId = location.state?.siteId;
  const siteName = location.state?.siteName;
  const companyId = location.state?.companyId;
  
  const driver = drivers.find(d => d.employeeId === employeeId);
  
  // Site display information
  const siteInfo = useMemo(() => {
    if (siteName && siteId) {
      return { name: siteName, id: siteId };
    }
    return driver ? { name: 'Your Facility', id: driver.siteId } : null;
  }, [driver, siteId, siteName]);

  // Authentication states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  
  // Security questions state
  const [question1, setQuestion1] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer2, setAnswer2] = useState('');

  // Password reset states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetAnswer1, setResetAnswer1] = useState('');
  const [resetAnswer2, setResetAnswer2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState<{ question1: string, question2: string } | null>(null);

  // Redirect if no employeeId in state
  useEffect(() => {
    if (!employeeId) {
      navigate('/');
    } else if (driver) {
      // Check if the driver needs to set up password
      setShowPasswordSetup(!driver.passwordSet);
      
      // If they have a password but need to set up security questions
      if (driver.passwordSet && !driver.securityQuestionsSet) {
        setShowSecurityQuestions(true);
      }
      
      // If they're trying password reset, fetch their security questions
      if (isForgotPassword && driver.securityQuestionsSet) {
        const questions = getDriverSecurityQuestions(employeeId);
        if (questions) {
          setSecurityQuestions(questions);
        }
      }
    }
  }, [employeeId, driver, navigate, isForgotPassword, getDriverSecurityQuestions]);

  // Handle login submission
  const handleLogin = () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call for validation
    setTimeout(() => {
      const isValid = validateDriverCredentials(employeeId, password);
      
      if (isValid) {
        // Log this activity
        if (driver) {
          logDriverActivity({
            driverId: employeeId,
            driverName: driver.name,
            action: 'login',
            details: 'Successfully logged in'
          });
        }
        
        // Navigate to driver preferences page with site information
        navigate('/driver-preferences', { 
          state: { 
            employeeId, 
            authenticated: true,
            siteId: siteId || driver?.siteId,
            siteName: siteName,
            companyId: companyId || driver?.companyId
          } 
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }, 800);
  };

  // Handle password setup
  const handlePasswordSetup = () => {
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please enter and confirm your password",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call for setting password
    setTimeout(() => {
      setDriverPassword(employeeId, password);
      
      setIsLoading(false);
      setShowPasswordSetup(false);
      
      // If security questions need to be set up
      setShowSecurityQuestions(true);
      
      toast({
        title: "Password Set",
        description: "Your password has been set successfully.",
      });
    }, 800);
  };

  // Handle security questions setup
  const handleSecurityQuestionsSetup = () => {
    if (!question1 || !answer1 || !question2 || !answer2) {
      toast({
        title: "Error",
        description: "Please select both security questions and provide answers",
        variant: "destructive",
      });
      return;
    }

    if (question1 === question2) {
      toast({
        title: "Error",
        description: "Please select two different security questions",
        variant: "destructive",
      });
      return;
    }

    if (answer1.length < 2 || answer2.length < 2) {
      toast({
        title: "Error",
        description: "Security answers must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call for setting security questions
    setTimeout(() => {
      setDriverSecurityQuestions(employeeId, {
        question1,
        answer1,
        question2,
        answer2
      });
      
      setIsLoading(false);
      setShowSecurityQuestions(false);
      
      toast({
        title: "Security Questions Set",
        description: "Your security questions have been set successfully.",
      });
      
      // Navigate to driver preferences page with site information
      navigate('/driver-preferences', { 
        state: { 
          employeeId, 
          authenticated: true,
          siteId: siteId || driver?.siteId,
          siteName: siteName,
          companyId: companyId || driver?.companyId
        } 
      });
    }, 800);
  };

  // Handle password reset request
  const handlePasswordReset = () => {
    if (!resetAnswer1 || !resetAnswer2) {
      toast({
        title: "Error",
        description: "Please answer both security questions",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      toast({
        title: "Error",
        description: "Please enter and confirm your new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Validate security answers
    setTimeout(() => {
      const isValid = validateSecurityAnswers(employeeId, {
        answer1: resetAnswer1,
        answer2: resetAnswer2
      });
      
      if (isValid) {
        // Reset password
        setDriverPassword(employeeId, newPassword);
        
        setIsLoading(false);
        setIsForgotPassword(false);
        
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. You can now log in with your new password.",
        });
      } else {
        toast({
          title: "Incorrect Answers",
          description: "Your security question answers are incorrect.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }, 800);
  };

  // Handle back button on password reset
  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setResetAnswer1('');
    setResetAnswer2('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Render password setup screen
  if (showPasswordSetup) {
    return (
      <MainLayout title="Set Up Your Password">
        <div className="jss-container py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Create Your Password</CardTitle>
              <CardDescription>
                You need to set up a password to access the job selection system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordSetup}
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Create Password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Render security questions setup screen
  if (showSecurityQuestions) {
    return (
      <MainLayout title="Set Up Security Questions">
        <div className="jss-container py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Set Up Security Questions</CardTitle>
              <CardDescription>
                Please set up security questions to help you recover your password if needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question1">Security Question 1</Label>
                  <Select value={question1} onValueChange={setQuestion1}>
                    <SelectTrigger id="question1">
                      <SelectValue placeholder="Select a security question" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECURITY_QUESTIONS.map((q, i) => (
                        <SelectItem key={i} value={q}>{q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer1">Answer 1</Label>
                  <Input
                    id="answer1"
                    placeholder="Your answer"
                    value={answer1}
                    onChange={(e) => setAnswer1(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question2">Security Question 2</Label>
                  <Select value={question2} onValueChange={setQuestion2}>
                    <SelectTrigger id="question2">
                      <SelectValue placeholder="Select a security question" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECURITY_QUESTIONS.map((q, i) => (
                        <SelectItem key={i} value={q}>{q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer2">Answer 2</Label>
                  <Input
                    id="answer2"
                    placeholder="Your answer"
                    value={answer2}
                    onChange={(e) => setAnswer2(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button 
                onClick={handleSecurityQuestionsSetup}
                disabled={isLoading || !question1 || !answer1 || !question2 || !answer2}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Render password reset screen
  if (isForgotPassword) {
    return (
      <MainLayout title="Reset Your Password">
        <div className="jss-container py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                Answer your security questions to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityQuestions && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="question1">{securityQuestions.question1}</Label>
                      <Input
                        id="answer1"
                        placeholder="Your answer"
                        value={resetAnswer1}
                        onChange={(e) => setResetAnswer1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="question2">{securityQuestions.question2}</Label>
                      <Input
                        id="answer2"
                        placeholder="Your answer"
                        value={resetAnswer2}
                        onChange={(e) => setResetAnswer2(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="Confirm your new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBackToLogin}>
                Back to Login
              </Button>
              <Button 
                onClick={handlePasswordReset}
                disabled={isLoading || !resetAnswer1 || !resetAnswer2 || !newPassword || !confirmNewPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Render normal login screen
  return (
    <MainLayout title="Driver Login">
      <div className="jss-container py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Driver Login</CardTitle>
            <CardDescription>
              Please enter your password to access the job selection system.
              {siteInfo && (
                <div className="mt-2 text-sm font-medium text-blue-600">
                  You are logging into: {siteInfo.name} ({siteInfo.id})
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Label>Employee ID:</Label>
              <span className="font-medium">{employeeId}</span>
            </div>
            {driver && (
              <div className="flex items-center justify-between mb-6">
                <Label>Driver Name:</Label>
                <span className="font-medium">{driver.name}</span>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="text-right">
                <Button variant="link" onClick={() => setIsForgotPassword(true)} className="text-sm">
                  Forgot password?
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back
            </Button>
            <Button 
              onClick={handleLogin}
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <Key className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}

export default DriverLoginPage;