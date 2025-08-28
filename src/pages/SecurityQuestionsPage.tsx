import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * SecurityQuestionsPage
 *
 * Minimal placeholder page so the Reset Password flow no longer 404s.
 * It reads the ?emplid=… from the URL and shows a friendly message.
 *
 * You can extend this later to actually ask/verify questions, then
 * hand off to a password reset form.
 */
export default function SecurityQuestionsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const emplid = params.get("emplid") ?? "";

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Security Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            We detected Employee ID: <span className="font-medium">{emplid || "—"}</span>
          </p>

          <p>
            This placeholder page exists to stop the 404 while we wire up the full
            security-question verification. For now, click the button below to go
            back to the login screen and continue.
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate("/driver-login")}>
              Back to Login
            </Button>
            {/* When you’re ready to implement verification + password change,
                replace this with your actual form and flow. */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
