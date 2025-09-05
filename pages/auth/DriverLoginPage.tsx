import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { dataService } from '@/services/data-service';
import { JssLogo } from '@/components/logo/JssLogo';

/**
 * DriverLoginPage - Secure driver authentication using email OTP
 * Replaces the insecure localStorage-based system
 */
export function DriverLoginPage() {
  const [step, setStep] = useState<'employee-id' | 'email' | 'otp'>('employee-id');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [driverData, setDriverData] = useState<any>(null);
  
  const { toast } = useToast();
  const { 
    isAuthenticated, 
    isLoading, 
    sendOTP, 
    verifyOTP,
    isOTPSent 
  } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleEmployeeIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId.trim()) {
      toast({
        title: "Employee ID Required",
        description: "Please enter your employee ID",
        variant: "destructive"
      });
      return;
    }

    try {
      // Look up driver by employee ID
      const drivers = await dataService.getDrivers();
      const driver = drivers.find(d => d.employeeId === employeeId);

      if (!driver) {
        toast({
          title: "Driver Not Found",
          description: "Employee ID not found in system. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      if (!driver.isEligible) {
        toast({
          title: "Access Denied", 
          description: "Your account is not eligible for job selection. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      setDriverData(driver);
      setStep('email');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify employee ID. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendOTP(email, 'driver');
      setStep('otp');
      toast({
        title: "Verification Code Sent",
        description: `A verification code has been sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Send Code",
        description: "Could not send verification code. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      toast({
        title: "Verification Code Required",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    try {
      await verifyOTP(email, otp, 'driver', {
        employeeId: driverData.employeeId,
        companyId: driverData.companyId,
        siteId: driverData.siteId
      });

      toast({
        title: "Login Successful",
        description: `Welcome back, ${driverData.name}!`,
      });
      
      // Navigation will happen automatically via the redirect above
    } catch (error) {
      toast({
        title: "Invalid Code",
        description: "The verification code is incorrect or expired. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <JssLogo className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Driver Portal</h1>
          <p className="text-gray-600 mt-2">
            {step === 'employee-id' && 'Enter your employee ID to continue'}
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'otp' && 'Enter the verification code sent to your email'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'employee-id' && 'Employee Verification'}
              {step === 'email' && 'Email Verification'}
              {step === 'otp' && 'Code Verification'}
            </CardTitle>
            <CardDescription>
              {step === 'employee-id' && 'Please enter your employee ID to begin'}
              {step === 'email' && `Hello ${driverData?.name}, please enter your email`}
              {step === 'otp' && 'Check your email for the verification code'}
            </CardDescription>
          </CardHeader>

          {/* Employee ID Step */}
          {step === 'employee-id' && (
            <form onSubmit={handleEmployeeIdSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="Enter your employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Continue'}
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                
                {/* Driver Info Display */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Driver:</strong> {driverData?.name}<br />
                    <strong>Company:</strong> {driverData?.companyId}<br />
                    <strong>Site:</strong> {driverData?.siteId}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('employee-id')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Code'}
                </Button>
              </CardFooter>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  Code sent to: <strong>{email}</strong>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('email')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Login'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        {/* Resend Code Option */}
        {step === 'otp' && (
          <div className="text-center mt-4">
            <Button
              variant="link"
              onClick={() => handleEmailSubmit({ preventDefault: () => {} } as any)}
              disabled={isLoading}
              className="text-sm"
            >
              Didn't receive the code? Resend
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}