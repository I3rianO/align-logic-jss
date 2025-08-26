import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useDriverStore from '@/store/driverStore';
import { ChevronLeft, Download, FileText, Users, Briefcase, Calendar, ChevronRight, LineChart, BarChart2 } from 'lucide-react';

// Importing chart components from a CDN
// In a real app, these would be properly installed via npm
const ReactApexChart = (window as any).ReactApexChart;

function StatisticsPage() {
  const navigate = useNavigate();
  const { 
    drivers, 
    jobs, 
    preferences,
    calculateJobAssignments,
  } = useDriverStore();

  const [activeTab, setActiveTab] = useState('overview');

  // Go back to admin dashboard
  const goBack = () => {
    navigate('/admin-dashboard');
  };

  // Calculate statistics for overview
  const eligibleDrivers = drivers.filter(d => d.isEligible);
  const uniquePreferences = Array.from(
    new Map(preferences.map(p => [p.driverId, p])).values()
  );
  const jobAssignments = calculateJobAssignments();
  
  const submittedCount = uniquePreferences.length;
  const notSubmittedCount = eligibleDrivers.length - submittedCount;
  const submissionRate = eligibleDrivers.length > 0 
    ? Math.round((submittedCount / eligibleDrivers.length) * 100) 
    : 0;

  const airportJobs = jobs.filter(job => job.isAirport).length;
  const nonAirportJobs = jobs.length - airportJobs;
  const airportJobRate = jobs.length > 0 
    ? Math.round((airportJobs / jobs.length) * 100)
    : 0;

  const airportCertifiedDrivers = drivers.filter(d => d.airportCertified).length;
  const airportDriverRate = drivers.length > 0 
    ? Math.round((airportCertifiedDrivers / drivers.length) * 100)
    : 0;

  // Calculate assignment types
  const preferenceAssignments = jobAssignments.filter(a => a.assignmentType === 'preference').length;
  const manualAssignments = jobAssignments.filter(a => a.assignmentType === 'manual').length;
  const autoAssignments = jobAssignments.filter(a => a.assignmentType === 'vc-assigned' || a.assignmentType === 'airport-auto' || a.assignmentType === 'airport-driver-pool').length;
  const seniorityAssignments = jobAssignments.filter(a => a.assignmentType === 'seniority').length;

  const preferenceRate = jobAssignments.length > 0 
    ? Math.round((preferenceAssignments / jobAssignments.length) * 100)
    : 0;

  // Calculate average number of preferences per driver
  const totalPreferences = uniquePreferences.reduce((acc, pref) => acc + pref.preferences.length, 0);
  const averagePreferences = submittedCount > 0 
    ? Math.round((totalPreferences / submittedCount) * 10) / 10
    : 0;

  // Chart options for the preference distribution chart
  const preferenceDistributionOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        distributed: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: ['1st', '2nd', '3rd', '4th', '5th+'],
      title: {
        text: 'Preference Rank',
      },
    },
    yaxis: {
      title: {
        text: 'Number of Drivers',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " drivers";
        },
      },
    },
    colors: ['#3182CE', '#4299E1', '#63B3ED', '#90CDF4', '#BEE3F8'],
  };

  // Calculate preference distribution
  const getPreferenceDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // 1st, 2nd, 3rd, 4th, 5th+

    jobAssignments.forEach(assignment => {
      if (assignment.assignmentType === 'preference') {
        const driverPref = uniquePreferences.find(p => p.driverId === assignment.driverId);
        if (driverPref) {
          const preferenceIndex = driverPref.preferences.findIndex(jobId => jobId === assignment.jobId);
          if (preferenceIndex <= 3) {
            distribution[preferenceIndex]++;
          } else {
            distribution[4]++; // 5th or higher preference
          }
        }
      }
    });

    return [{
      name: "Drivers",
      data: distribution
    }];
  };

  // Chart options for the job distribution chart
  const jobDistributionOptions = {
    chart: {
      type: 'pie',
      height: 350,
    },
    labels: ['Morning (5-10)', 'Day (10-15)', 'Evening (15-20)', 'Night (20-5)'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    colors: ['#38B2AC', '#4299E1', '#805AD5', '#1A202C'],
  };

  // Calculate job time distribution
  const getJobTimeDistribution = () => {
    const distribution = [0, 0, 0, 0]; // Morning, Day, Evening, Night

    jobs.forEach(job => {
      const hour = parseInt(job.startTime.split(':')[0]);
      
      if (hour >= 5 && hour < 10) {
        distribution[0]++;
      } else if (hour >= 10 && hour < 15) {
        distribution[1]++;
      } else if (hour >= 15 && hour < 20) {
        distribution[2]++;
      } else {
        distribution[3]++;
      }
    });

    return distribution;
  };

  // Chart options for the assignment types chart
  const assignmentTypesOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Preference-Based', 'Manual', 'Auto-Assigned', 'Seniority'],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    colors: ['#68D391', '#4299E1', '#F6AD55', '#FC8181'],
  };

  // Calculate weekly job distribution
  const weekdayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const getWeekdayDistribution = () => {
    const distribution = Array(7).fill(0);
    
    jobs.forEach(job => {
      const weekDays = job.weekDays.split('-');
      weekDays.forEach(day => {
        const dayLower = day.toLowerCase();
        
        if (dayLower.includes('mon')) distribution[0]++;
        if (dayLower.includes('tue')) distribution[1]++;
        if (dayLower.includes('wed')) distribution[2]++;
        if (dayLower.includes('thu')) distribution[3]++;
        if (dayLower.includes('fri')) distribution[4]++;
        if (dayLower.includes('sat')) distribution[5]++;
        if (dayLower.includes('sun')) distribution[6]++;
      });
    });
    
    return [{
      name: "Jobs",
      data: distribution
    }];
  };
  
  const weekdayDistributionOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: weekdayLabels,
      title: {
        text: 'Weekday',
      },
    },
    yaxis: {
      title: {
        text: 'Number of Jobs',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " jobs";
        },
      },
    },
    colors: ['#4299E1'],
  };

  // Get driver seniority distribution
  const getSeniorityDistribution = () => {
    // Group drivers by seniority range
    const ranges = {
      '1-10': 0,
      '11-20': 0,
      '21-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51+': 0
    };
    
    drivers.forEach(driver => {
      const seniority = driver.seniorityNumber;
      
      if (seniority <= 10) ranges['1-10']++;
      else if (seniority <= 20) ranges['11-20']++;
      else if (seniority <= 30) ranges['21-30']++;
      else if (seniority <= 40) ranges['31-40']++;
      else if (seniority <= 50) ranges['41-50']++;
      else ranges['51+']++;
    });
    
    return [{
      name: "Drivers",
      data: Object.values(ranges)
    }];
  };
  
  const seniorityDistributionOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: Object.keys(({
        '1-10': 0,
        '11-20': 0,
        '21-30': 0,
        '31-40': 0,
        '41-50': 0,
        '51+': 0
      })),
      title: {
        text: 'Seniority Range',
      },
    },
    yaxis: {
      title: {
        text: 'Number of Drivers',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " drivers";
        },
      },
    },
    colors: ['#805AD5'],
  };

  // Get popular job requests
  const getPopularJobs = () => {
    const jobCount = {};
    
    // Count how many times each job is preferred
    uniquePreferences.forEach(pref => {
      pref.preferences.forEach(jobId => {
        jobCount[jobId] = (jobCount[jobId] || 0) + 1;
      });
    });
    
    // Convert to array and sort by count
    const sorted = Object.entries(jobCount)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .slice(0, 10); // Top 10
    
    // Extract labels and data
    const labels = sorted.map(([jobId]) => jobId);
    const data = sorted.map(([, count]) => count);
    
    return {
      labels,
      data: [{
        name: "Driver Preferences",
        data
      }]
    };
  };
  
  const popularJobsData = getPopularJobs();
  
  const popularJobsOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: popularJobsData.labels,
      title: {
        text: 'Job ID',
      },
    },
    yaxis: {
      title: {
        text: 'Number of Preferences',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " preferences";
        },
      },
    },
    colors: ['#F6AD55'],
  };
  
  // Get job assignment satisfaction rate
  // (percentage of drivers who got one of their top 3 preferences)
  const calculateSatisfactionRate = () => {
    let satisfiedDrivers = 0;
    let totalDriversWithPreferences = 0;
    
    uniquePreferences.forEach(pref => {
      if (pref.preferences.length > 0) {
        totalDriversWithPreferences++;
        
        // Check if driver got one of their top 3 preferences
        const assignment = jobAssignments.find(a => a.driverId === pref.driverId);
        if (assignment) {
          const preferenceIndex = pref.preferences.indexOf(assignment.jobId);
          if (preferenceIndex !== -1 && preferenceIndex < 3) { // Top 3 preferences
            satisfiedDrivers++;
          }
        }
      }
    });
    
    return totalDriversWithPreferences > 0 
      ? Math.round((satisfiedDrivers / totalDriversWithPreferences) * 100) 
      : 0;
  };
  
  const satisfactionRate = calculateSatisfactionRate();

  return (
    <MainLayout title="Job Selection System Statistics">
      <div className="jss-container py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#222]">Job Selection Statistics</h1>
            
            <Button 
              variant="outline" 
              onClick={goBack}
              className="admin-btn-secondary flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </Button>
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview" className="text-sm">System Overview</TabsTrigger>
              <TabsTrigger value="drivers" className="text-sm">Driver Analytics</TabsTrigger>
              <TabsTrigger value="jobs" className="text-sm">Job Analytics</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Submission Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{submissionRate}%</div>
                      <div className="text-sm text-muted-foreground">{submittedCount} / {eligibleDrivers.length}</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${submissionRate}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Driver Satisfaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{satisfactionRate}%</div>
                      <div className="text-sm text-muted-foreground">Top 3 preferences</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${satisfactionRate}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Avg. Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{averagePreferences}</div>
                      <div className="text-sm text-muted-foreground">per driver</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {totalPreferences} total preferences submitted
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Assignment Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{Math.round(jobAssignments.length / jobs.length * 100)}%</div>
                      <div className="text-sm text-muted-foreground">{jobAssignments.length} / {jobs.length}</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.round(jobAssignments.length / jobs.length * 100)}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preference Distribution</CardTitle>
                    <CardDescription>Drivers who received their 1st, 2nd, 3rd, etc. preference</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="preference-distribution-chart">
                      {typeof ReactApexChart !== 'undefined' && (
                        <ReactApexChart 
                          options={preferenceDistributionOptions} 
                          series={getPreferenceDistribution()} 
                          type="bar" 
                          height={350} 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Types</CardTitle>
                    <CardDescription>How jobs were assigned to drivers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="assignment-types-chart">
                      {typeof ReactApexChart !== 'undefined' && (
                        <ReactApexChart 
                          options={assignmentTypesOptions} 
                          series={[preferenceAssignments, manualAssignments, autoAssignments, seniorityAssignments]} 
                          type="donut" 
                          height={350} 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Summary</CardTitle>
                  <CardDescription>Key metrics about jobs and drivers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center p-4 bg-[#f7f9fa] rounded-lg border">
                      <Users className="h-8 w-8 text-blue-500 mb-2" />
                      <div className="text-2xl font-bold">{drivers.length}</div>
                      <div className="text-sm text-muted-foreground">Total Drivers</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 bg-[#f7f9fa] rounded-lg border">
                      <Briefcase className="h-8 w-8 text-blue-500 mb-2" />
                      <div className="text-2xl font-bold">{jobs.length}</div>
                      <div className="text-sm text-muted-foreground">Total Jobs</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 bg-[#f7f9fa] rounded-lg border">
                      <Calendar className="h-8 w-8 text-blue-500 mb-2" />
                      <div className="text-2xl font-bold">{airportJobRate}%</div>
                      <div className="text-sm text-muted-foreground">Airport Jobs</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 bg-[#f7f9fa] rounded-lg border">
                      <LineChart className="h-8 w-8 text-blue-500 mb-2" />
                      <div className="text-2xl font-bold">{airportDriverRate}%</div>
                      <div className="text-sm text-muted-foreground">Airport Certified</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Drivers Tab */}
            <TabsContent value="drivers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Drivers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{drivers.length}</div>
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {eligibleDrivers.length} eligible for selection
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Preference Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{submittedCount}</div>
                      <FileText className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {notSubmittedCount} drivers haven't submitted
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Airport Certified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{airportCertifiedDrivers}</div>
                      <div className="text-sm text-muted-foreground">{airportDriverRate}%</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${airportDriverRate}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">VC Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{drivers.filter(d => d.vcStatus).length}</div>
                      <div className="text-sm text-muted-foreground">{Math.round(drivers.filter(d => d.vcStatus).length / drivers.length * 100)}%</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round(drivers.filter(d => d.vcStatus).length / drivers.length * 100)}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Driver Seniority Distribution</CardTitle>
                    <CardDescription>Number of drivers by seniority range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="seniority-distribution-chart">
                      {typeof ReactApexChart !== 'undefined' && (
                        <ReactApexChart 
                          options={seniorityDistributionOptions} 
                          series={getSeniorityDistribution()} 
                          type="bar" 
                          height={350} 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Driver Preferences Analysis</CardTitle>
                    <CardDescription>Key metrics about driver preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Average Preferences Submitted</p>
                          <p className="text-2xl font-bold">{averagePreferences}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <ChevronRight className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Got 1st Choice</p>
                          <p className="text-2xl font-bold">
                            {getPreferenceDistribution()[0].data[0]}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({Math.round((getPreferenceDistribution()[0].data[0] / preferenceAssignments) * 100)}%)
                            </span>
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <ChevronRight className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Got Top 3 Choice</p>
                          <p className="text-2xl font-bold">
                            {getPreferenceDistribution()[0].data.slice(0, 3).reduce((a, b) => a + b, 0)}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({Math.round((getPreferenceDistribution()[0].data.slice(0, 3).reduce((a, b) => a + b, 0) / preferenceAssignments) * 100)}%)
                            </span>
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <ChevronRight className="h-6 w-6 text-purple-500" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Drivers Not Getting Preferences</p>
                          <p className="text-2xl font-bold">
                            {submittedCount - preferenceAssignments}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({Math.round(((submittedCount - preferenceAssignments) / submittedCount) * 100)}%)
                            </span>
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <ChevronRight className="h-6 w-6 text-amber-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Driver Assignment Stats</CardTitle>
                  <CardDescription>How drivers were assigned to jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col p-4 bg-[#f7f9fa] rounded-lg border">
                      <div className="text-sm font-medium mb-1">Preference-Based</div>
                      <div className="text-2xl font-bold text-green-600">{preferenceAssignments}</div>
                      <div className="text-sm text-muted-foreground">{preferenceRate}% of assignments</div>
                    </div>
                    
                    <div className="flex flex-col p-4 bg-[#f7f9fa] rounded-lg border">
                      <div className="text-sm font-medium mb-1">Manual Assignments</div>
                      <div className="text-2xl font-bold text-blue-600">{manualAssignments}</div>
                      <div className="text-sm text-muted-foreground">{Math.round((manualAssignments / jobAssignments.length) * 100)}% of assignments</div>
                    </div>
                    
                    <div className="flex flex-col p-4 bg-[#f7f9fa] rounded-lg border">
                      <div className="text-sm font-medium mb-1">Auto-Assigned</div>
                      <div className="text-2xl font-bold text-amber-600">{autoAssignments}</div>
                      <div className="text-sm text-muted-foreground">{Math.round((autoAssignments / jobAssignments.length) * 100)}% of assignments</div>
                    </div>
                    
                    <div className="flex flex-col p-4 bg-[#f7f9fa] rounded-lg border">
                      <div className="text-sm font-medium mb-1">Seniority-Based</div>
                      <div className="text-2xl font-bold text-red-600">{seniorityAssignments}</div>
                      <div className="text-sm text-muted-foreground">{Math.round((seniorityAssignments / jobAssignments.length) * 100)}% of assignments</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{jobs.length}</div>
                      <Briefcase className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {jobAssignments.length} assigned ({Math.round((jobAssignments.length / jobs.length) * 100)}%)
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Airport Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{airportJobs}</div>
                      <div className="text-sm text-muted-foreground">{airportJobRate}%</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${airportJobRate}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Non-Airport Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{nonAirportJobs}</div>
                      <div className="text-sm text-muted-foreground">{100 - airportJobRate}%</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${100 - airportJobRate}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Unassigned Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#222]">{jobs.length - jobAssignments.length}</div>
                      <BarChart2 className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {Math.round(((jobs.length - jobAssignments.length) / jobs.length) * 100)}% of all jobs
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Time Distribution</CardTitle>
                    <CardDescription>Jobs by time of day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="job-time-distribution-chart">
                      {typeof ReactApexChart !== 'undefined' && (
                        <ReactApexChart 
                          options={jobDistributionOptions} 
                          series={getJobTimeDistribution()} 
                          type="pie" 
                          height={350} 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Job Distribution</CardTitle>
                    <CardDescription>Jobs by day of week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="weekday-distribution-chart">
                      {typeof ReactApexChart !== 'undefined' && (
                        <ReactApexChart 
                          options={weekdayDistributionOptions} 
                          series={getWeekdayDistribution()} 
                          type="bar" 
                          height={350} 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Most Requested Jobs</CardTitle>
                  <CardDescription>Jobs with most driver preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div id="popular-jobs-chart">
                    {typeof ReactApexChart !== 'undefined' && (
                      <ReactApexChart 
                        options={popularJobsOptions} 
                        series={popularJobsData.data} 
                        type="bar" 
                        height={350} 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Button 
            variant="outline" 
            onClick={goBack}
            className="admin-btn-secondary"
          >
            <ChevronLeft size={16} className="mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default StatisticsPage;