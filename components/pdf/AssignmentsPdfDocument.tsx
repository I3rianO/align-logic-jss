import React from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PrinterIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Assignment {
  driverId: string;
  jobId: string;
  driverName?: string;
  jobDetails?: {
    startTime: string;
    weekDays: string;
    isAirport: boolean;
  };
  assignmentType: string;
}

interface Driver {
  employeeId: string;
  name: string;
  seniorityNumber: number;
  vcStatus: boolean;
  airportCertified: boolean;
  isEligible: boolean;
  passwordSet: boolean;
  securityQuestionsSet: boolean;
}

interface Job {
  jobId: string;
  startTime: string;
  isAirport: boolean;
  weekDays: string;
}

interface AssignmentsPdfDocumentProps {
  assignments: Assignment[];
  drivers: Driver[];
  jobs: Job[];
}

const AssignmentsPdfDocument: React.FC<AssignmentsPdfDocumentProps> = ({
  assignments,
  drivers,
  jobs
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Job Assignments - Print View</title>
              <style>
                body {
                  font-family: 'Arial', sans-serif;
                  line-height: 1.5;
                  color: #333;
                  padding: 20px;
                  max-width: 1000px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  padding: 10px 0 30px;
                  border-bottom: 2px solid #355C7D;
                  margin-bottom: 20px;
                }
                .title {
                  font-size: 24px;
                  font-weight: bold;
                  margin: 0 0 10px;
                }
                .subtitle {
                  font-size: 16px;
                  color: #666;
                  margin: 0;
                }
                .date {
                  font-size: 14px;
                  color: #666;
                  margin: 10px 0 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                th, td {
                  text-align: left;
                  padding: 8px 12px;
                  border-bottom: 1px solid #ddd;
                }
                th {
                  background-color: #f7f9fa;
                  font-weight: bold;
                }
                tr:nth-child(even) {
                  background-color: #f9f9f9;
                }
                .badge {
                  display: inline-block;
                  padding: 3px 8px;
                  border-radius: 12px;
                  font-size: 11px;
                  font-weight: bold;
                  text-transform: uppercase;
                }
                .badge-first {
                  background-color: #e3efff;
                  color: #1a56db;
                  border: 1px solid #cce0ff;
                }
                .badge-pick {
                  background-color: #e3fcef;
                  color: #16a34a;
                  border: 1px solid #ccf5e0;
                }
                .badge-auto {
                  background-color: #fff0e3;
                  color: #d97706;
                  border: 1px solid #ffe0cc;
                }
                .badge-airport {
                  background-color: #e3f1ff;
                  color: #2563eb;
                  border: 1px solid #cce3ff;
                }
                .footer {
                  margin-top: 40px;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                }
                .note {
                  margin: 30px 0;
                  padding: 15px;
                  border: 1px solid #ddd;
                  background-color: #f9f9f9;
                  border-radius: 5px;
                }
                .note-title {
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                @media print {
                  body {
                    padding: 0;
                    margin: 0;
                  }
                  .print-button {
                    display: none;
                  }
                  @page {
                    margin: 2cm;
                  }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // Sort assignments by seniority
  const sortedAssignments = [...assignments].sort((a, b) => {
    const driverA = drivers.find(d => d.employeeId === a.driverId);
    const driverB = drivers.find(d => d.employeeId === b.driverId);
    if (!driverA || !driverB) return 0;
    return driverA.seniorityNumber - driverB.seniorityNumber;
  });

  // Format current date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card className="shadow-lg border-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            Final Job Assignments - Print View
          </h2>
          <Button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PrinterIcon className="mr-2 h-4 w-4" /> Print Assignments
          </Button>
        </div>
        
        <div ref={printRef} className="print-document">
          <div className="header">
            <h1 className="title">Job Selection System - Final Assignments</h1>
            <p className="subtitle">Official Assignments for Driver Distribution</p>
            <p className="date">Generated on {formattedDate}</p>
          </div>
          
          <div className="note">
            <div className="note-title">Important Information:</div>
            <p>The following assignments are final and have been determined based on driver preferences and seniority numbers. These assignments are posted for all drivers to review.</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Seniority</th>
                <th>Driver Name</th>
                <th>Job</th>
                <th>Schedule</th>
                <th>Assignment Type</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssignments.map((assignment, index) => {
                const driver = drivers.find(d => d.employeeId === assignment.driverId);
                const job = jobs.find(j => j.jobId === assignment.jobId);
                
                if (!driver || !job) return null;
                
                // Map assignment type to user-friendly text and badge class
                let assignmentTypeText = "Auto-Assigned";
                let badgeClass = "badge-auto";
                
                if (assignment.assignmentType === 'preference') {
                  assignmentTypeText = "First Choice";
                  badgeClass = "badge-first";
                } else if (assignment.assignmentType === 'airport-driver' || 
                           assignment.assignmentType === 'airport-driver-pool') {
                  assignmentTypeText = "Pick Match";
                  badgeClass = "badge-pick";
                } else if (assignment.assignmentType === 'airport-auto') {
                  assignmentTypeText = "Airport Assignment";
                  badgeClass = "badge-airport";
                }
                
                return (
                  <tr key={index}>
                    <td>{driver.seniorityNumber}</td>
                    <td>{driver.name}</td>
                    <td>
                      {job.jobId}
                      {job.isAirport && <span className="badge badge-airport" style={{marginLeft: '8px'}}>Airport</span>}
                    </td>
                    <td>{job.startTime} - {job.weekDays}</td>
                    <td><span className={`badge ${badgeClass}`}>{assignmentTypeText}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="footer">
            <p>This document is automatically generated by the Job Selection System. Please contact your administrator for any questions.</p>
            <p>© {new Date().getFullYear()} Brian P. O'Leary | Job Selection System</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentsPdfDocument;