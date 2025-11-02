const sampleFeedPosts = [{
                id: 2,
                username: "GreenGamer92",
                avatar: "👩",
                action: "Reduced phone usage by 40% today",
                credits: 50,
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                likes: 18,
                comments: 3,
                verified: true
            },
            {
                id: 3,
                username: "SustainableSam",
                avatar: "👨",
                action: "Planted a tree & earned 100 credits",
                credits: 100,
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                likes: 42,
                comments: 8,
                verified: true
            }
        ];

        // Sample Family Data
        const sampleFamilyMembers = [
            {
                id: 1,
                name: "Dad",
                relation: "Father",
                avatar: "👨",
                credits: 1850,
                streak: 12,
                trustScore: 82,
                trees: 3
            },
            {
                id: 2,
                name: "Mom",
                relation: "Mother",
                avatar: "👩",
                credits: 1620,
                streak: 9,
                trustScore: 88,
                trees: 4
            },
            {
                id: 3,
                name: "Brother",
                relation: "Brother",
                avatar: "👦",
                credits: 950,
                streak: 5,
                trustScore: 71,
                trees: 2
            }
        ];

        // ============================================
        // DEVICE FINGERPRINTING & SECURITY
        // ============================================

        function generateDeviceFingerprint() {
            const fingerprint = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency || 0,
                screen: screen.width + "x" + screen.height
            };
            
            const hash = btoa(JSON.stringify(fingerprint));
            return hash.substring(0, 16);
        }

        // ============================================
        // ANOMALY DETECTION ENGINE
        // ============================================

        class AnomalyDetector {
            static detectAnomalies(userData) {
                const anomalies = [];
                
                // 1. Velocity Check
                const recentSubmissions = userData.submissions.filter(s => 
                    new Date(s.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
                );
                if (recentSubmissions.length > 5) {
                    anomalies.push({
                        type: 'VELOCITY_SPIKE',
                        severity: 'HIGH',
                        message: `${recentSubmissions.length} submissions in last hour (max: 5)`,
                        score: Math.min(40, recentSubmissions.length * 8)
                    });
                }

                // 2. Time Pattern Check
                userData.submissions.forEach((submission, idx) => {
                    if (idx > 0) {
                        const prevSubmission = userData.submissions[idx - 1];
                        const timeDiff = (new Date(submission.timestamp) - new Date(prevSubmission.timestamp)) / 1000 / 60;
                        const questDuration = QUESTS.find(q => q.id == submission.questId)?.timeLimit || 60;
                        
                        if (timeDiff < questDuration + 5) {
                            anomalies.push({
                                type: 'IMPOSSIBLE_TIMING',
                                severity: 'HIGH',
                                message: `Quest completed ${timeDiff}min after previous (minimum: ${questDuration + 5}min)`,
                                score: 35
                            });
                        }
                    }
                });

                // 3. Perfect Success Rate
                if (userData.submissions.length > 20 && userData.verificationRate === 1.0) {
                    anomalies.push({
                        type: 'PERFECT_RECORD',
                        severity: 'LOW',
                        message: '100% verification rate with 20+ submissions (unlikely)',
                        score: 10
                    });
                }

                return anomalies;
            }

            static calculateAnomalyScore(anomalies) {
                return Math.min(100, anomalies.reduce((sum, a) => sum + a.score, 0));
            }

            static getAnomalyStatus(score) {
                if (score < 20) return { level: 'SAFE', color: 'green', message: '✓ Normal Behavior' };
                if (score < 50) return { level: 'CAUTION', color: 'yellow', message: '⚠ Monitor Activity' };
                return { level: 'HIGH_RISK', color: 'red', message: '🚨 Review Required' };
            }
        }

        // ============================================
        // RATE LIMITING & VELOCITY CHECKS
        // ============================================

        class RateLimiter {
            static checkRateLimits(userData) {
                const limits = {
                    perHour: 5,
                    perDay: 15,
                    cooldownMinutes: 15
                };

                const now = new Date();
                const oneHourAgo = new Date(now - 60 * 60 * 1000);
                const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

                const lastHour = userData.submissions.filter(s => new Date(s.timestamp) > oneHourAgo).length;
                const lastDay = userData.submissions.filter(s => new Date(s.timestamp) > oneDayAgo).length;

                const violations = [];

                if (lastHour >= limits.perHour) {
                    violations.push("You've reached the 5 submissions/hour limit.");
                }
                
                if (lastDay >= limits.perDay) {
                    violations.push("You've reached the 15 submissions/day limit.");
                }
                
                if (userData.lastSubmissionTime) {
                    const minutesSinceLastSubmission = (now - new Date(userData.lastSubmissionTime)) / 1000 / 60;
                    if (minutesSinceLastSubmission < limits.cooldownMinutes) {
                        violations.push(`Wait ${Math.ceil(limits.cooldownMinutes - minutesSinceLastSubmission)} more minutes.`);
                    }
                }

                return { allowed: violations.length === 0, violations };
            }
        }

        // ============================================
        // CRYPTOGRAPHIC VERIFICATION
        // ============================================

        class CryptoVerifier {
            static async createSubmissionHash(submission) {
                const data = JSON.stringify({
                    questId: submission.questId,
                    timestamp: submission.timestamp,
                    deviceId: submission.deviceId,
                    description: submission.description
                });
                
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(data);
                const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        }

        // ============================================
        // INITIALIZATION & STORAGE
        // ============================================

        function initializeUserData() {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                userData = JSON.parse(stored);
            } else {
                userData.familyMembers = sampleFamilyMembers;
                userData.feedPosts = sampleFeedPosts;
            }
            saveUserData();
            renderAll();
        }

        function saveUserData() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        }

        // ============================================
        // RENDERING FUNCTIONS - DASHBOARD
        // ============================================

        function renderDashboard() {
            document.getElementById('dashCredits').textContent = userData.credits.toLocaleString();
            document.getElementById('dashTrees').textContent = userData.trees;
            document.getElementById('dashStreak').textContent = userData.streak;
            document.getElementById('dashReduction').textContent = userData.phoneReduction + '%';
            document.getElementById('dashQuest')}
