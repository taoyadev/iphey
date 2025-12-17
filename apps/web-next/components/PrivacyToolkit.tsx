'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from '@/lib/translations';
import type { DetailedSignal } from '@/types/report';

interface PrivacyRecommendation {
  id: string;
  category: 'browser' | 'hardware' | 'software' | 'location';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  issues: string[];
  solutions: Array<{
    title: string;
    description: string;
    steps: string[];
    tools?: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    effectiveness: 'high' | 'medium' | 'low';
  }>;
  risks: string[];
  benefits: string[];
  estimatedTime: string;
}

interface PrivacyToolkitProps {
  signals?: DetailedSignal[];
  onApplyRecommendation?: (recommendationId: string, solutionIndex: number) => void;
}

export const PrivacyToolkit = ({ signals = [], onApplyRecommendation }: PrivacyToolkitProps) => {
  const t = useTranslations('privacy.toolkit');
  const tCategories = useTranslations('privacy.categories');
  const tEffectiveness = useTranslations('privacy.effectiveness');
  const tUA = useTranslations('privacy.userAgent');
  const tTZ = useTranslations('privacy.timezone');
  const tHW = useTranslations('privacy.hardware');
  const tSW = useTranslations('privacy.software');
  const tBL = useTranslations('privacy.baseline');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());

  // Generate recommendations based on signals
  const recommendations = useMemo(() => {
    const recs: PrivacyRecommendation[] = [];

    // Browser Privacy Recommendations
    if (signals.some(s => s.message.includes('User-Agent') || s.message.includes('automation'))) {
      recs.push({
        id: 'browser-ua-privacy',
        category: 'browser',
        priority: 'high',
        title: tUA('title'),
        description: tUA('description'),
        issues: [tUA('automationDetected'), tUA('versionMismatch'), tUA('platformInconsistencies')],
        solutions: [
          {
            title: tUA('updateBrowser'),
            description: tUA('updateBrowserDesc'),
            steps: [tUA('goToSettings'), tUA('checkForUpdates'), tUA('installLatest'), tUA('restartAndRecheck')],
            tools: ['Chrome', 'Firefox', 'Safari', 'Edge'],
            difficulty: 'easy',
            effectiveness: 'high',
          },
          {
            title: tUA('useExtensions'),
            description: tUA('useExtensionsDesc'),
            steps: [tUA('installSwitcher'), tUA('selectCommon'), tUA('avoidOutdated'), tUA('testWebsites')],
            tools: [tUA('switcherTool'), tUA('randomUserAgent'), 'Chameleon'],
            difficulty: 'medium',
            effectiveness: 'medium',
          },
        ],
        risks: [tUA('someBlockedRisk')],
        benefits: [tUA('reducedFalsePositive'), tUA('betterCompatibility')],
        estimatedTime: tUA('time515'),
      });
    }

    // Location Privacy Recommendations
    if (signals.some(s => s.message.includes('timezone') || s.message.includes('location'))) {
      recs.push({
        id: 'location-timezone-sync',
        category: 'location',
        priority: 'critical',
        title: tTZ('title'),
        description: tTZ('description'),
        issues: [tTZ('systemDiffers'), tTZ('languageMismatch'), tTZ('geolocationInconsistent')],
        solutions: [
          {
            title: tTZ('updateSystemTimezone'),
            description: tTZ('updateSystemTimezoneDesc'),
            steps: [tTZ('openSettings'), tTZ('navigateDateTime'), tTZ('setTimezone'), tTZ('restartBrowser')],
            tools: [tTZ('systemSettings'), tTZ('windowsSettings'), tTZ('macosPreferences')],
            difficulty: 'easy',
            effectiveness: 'high',
          },
          {
            title: tTZ('useVPN'),
            description: tTZ('useVPNDesc'),
            steps: [tTZ('chooseVPN'), tTZ('connectLocation'), tTZ('enableSync'), tTZ('verifyTimezone')],
            tools: [tTZ('mullvadVPN'), tTZ('protonVPN'), tTZ('nordVPN')],
            difficulty: 'medium',
            effectiveness: 'high',
          },
        ],
        risks: [tTZ('someAppsMayNeed')],
        benefits: [tTZ('eliminatesInconsistencies'), tTZ('improvesAnonymity')],
        estimatedTime: tTZ('time210'),
      });
    }

    // Hardware Fingerprinting Recommendations
    if (signals.some(s => s.message.includes('canvas') || s.message.includes('WebGL') || s.message.includes('fonts'))) {
      recs.push({
        id: 'hardware-fingerprint-protection',
        category: 'hardware',
        priority: 'high',
        title: tHW('title'),
        description: tHW('description'),
        issues: [tHW('canvasHighlyIdentifying'), tHW('webglReveals'), tHW('fontEnumeration')],
        solutions: [
          {
            title: tHW('installCanvas'),
            description: tHW('installCanvasDesc'),
            steps: [tHW('installCanvasBlocker'), tHW('configureNoise'), tHW('testFingerprinting'), tHW('adjustNoise')],
            tools: [tHW('canvasBlocker'), tHW('privacyBadger'), tHW('uBlockOrigin')],
            difficulty: 'medium',
            effectiveness: 'high',
          },
          {
            title: tHW('useTor'),
            description: tHW('useTorDesc'),
            steps: [tHW('downloadTor'), tHW('useDefaultSecurity'), tHW('avoidResizing'), tHW('keepJavaScript')],
            tools: [tHW('torBrowser')],
            difficulty: 'easy',
            effectiveness: 'high',
          },
          {
            title: tHW('configureFirefox'),
            description: tHW('configureFirefoxDesc'),
            steps: [
              tHW('installFirefox'),
              tHW('goToAboutConfig'),
              tHW('setResistFingerprinting'),
              tHW('adjustPrivacySettings'),
            ],
            tools: [tHW('firefox'), tHW('aboutConfig')],
            difficulty: 'hard',
            effectiveness: 'high',
          },
        ],
        risks: [tHW('someWebsitesMayBreak')],
        benefits: [tHW('significantlyReduced'), tHW('betterPrivacy')],
        estimatedTime: tHW('time1030'),
      });
    }

    // Software Privacy Recommendations
    if (signals.some(s => s.message.includes('cookies') || s.message.includes('WebRTC'))) {
      recs.push({
        id: 'software-privacy-hardening',
        category: 'software',
        priority: 'medium',
        title: tSW('title'),
        description: tSW('description'),
        issues: [tSW('cookiesUnusual'), tSW('webrtcLeak'), tSW('storageNotOptimal')],
        solutions: [
          {
            title: tSW('optimizeCookies'),
            description: tSW('optimizeCookiesDesc'),
            steps: [tSW('goToBrowserSettings'), tSW('blockThirdParty'), tSW('clearOnClose'), tSW('keepEssential')],
            tools: [tSW('browserSettings'), tSW('cookieAutoDelete'), tSW('privacySettings')],
            difficulty: 'easy',
            effectiveness: 'medium',
          },
          {
            title: tSW('configureWebRTC'),
            description: tSW('configureWebRTCDesc'),
            steps: [
              tSW('installWebRTCLeak'),
              tSW('testIPLeak'),
              tSW('configureExtension'),
              tSW('maintainFunctionality'),
            ],
            tools: [tSW('webrtcLeakShield'), tSW('uBlockOrigin'), tSW('privacyBadger')],
            difficulty: 'medium',
            effectiveness: 'high',
          },
        ],
        risks: [tSW('someWebsitesMayRequire')],
        benefits: [tSW('reducedTracking'), tSW('betterIPProtection')],
        estimatedTime: tSW('time515'),
      });
    }

    // General Privacy Recommendations
    recs.push({
      id: 'general-privacy-baseline',
      category: 'browser',
      priority: 'medium',
      title: tBL('title'),
      description: tBL('description'),
      issues: [tBL('noComprehensive'), tBL('basicVulnerabilities'), tBL('defaultTracking')],
      solutions: [
        {
          title: tBL('installEssential'),
          description: tBL('installEssentialDesc'),
          steps: [tBL('installUBlock'), tBL('addPrivacyBadger'), tBL('enableHTTPS'), tBL('configureOptimal')],
          tools: [tBL('uBlockOrigin'), tBL('privacyBadger'), tBL('httpsEverywhere'), tBL('decentraleyes')],
          difficulty: 'easy',
          effectiveness: 'high',
        },
        {
          title: tBL('configureSearch'),
          description: tBL('configureSearchDesc'),
          steps: [tBL('setDuckDuckGo'), tBL('configureStartPage'), tBL('disableHistory'), tBL('clearHistory')],
          tools: [tBL('duckDuckGo'), tBL('startPage'), tBL('qwant'), tBL('swisscows')],
          difficulty: 'easy',
          effectiveness: 'medium',
        },
      ],
      risks: [tBL('somePersonalizedLost')],
      benefits: [tBL('comprehensiveBaseline'), tBL('reducedTrackingWeb')],
      estimatedTime: tBL('time1020'),
    });

    return recs.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [signals, tUA, tTZ, tHW, tSW, tBL]);

  // Filter recommendations by category
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === 'all') return recommendations;
    return recommendations.filter(r => r.category === selectedCategory);
  }, [recommendations, selectedCategory]);

  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    const next = new Set(expandedRecommendations);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRecommendations(next);
  };

  // Toggle details
  const toggleDetails = (id: string) => {
    const next = new Set(showDetails);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setShowDetails(next);
  };

  // Mark action as completed
  const markCompleted = (id: string) => {
    const next = new Set(completedActions);
    next.add(id);
    setCompletedActions(next);
  };

  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', textColor: 'text-red-400' };
      case 'high':
        return { bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', textColor: 'text-orange-400' };
      case 'medium':
        return { bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', textColor: 'text-yellow-400' };
      case 'low':
        return { bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', textColor: 'text-blue-400' };
      default:
        return { bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20', textColor: 'text-slate-400' };
    }
  };

  // Get difficulty styling
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'medium':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
      case 'hard':
        return { color: 'text-red-400', bg: 'bg-red-500/10' };
      default:
        return { color: 'text-slate-400', bg: 'bg-slate-500/10' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-accent" />
          <h2 className="text-3xl font-bold text-white">{t('title')}</h2>
        </div>
        <p className="text-slate-300 max-w-2xl mx-auto">{t('subtitle')}</p>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{recommendations.length}</div>
            <div className="text-xs text-slate-400">{t('totalRecommendations')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">
              {recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length}
            </div>
            <div className="text-xs text-slate-400">{t('highPriority')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent">{completedActions.size}</div>
            <div className="text-xs text-slate-400">{t('completed')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {recommendations.filter(r => r.solutions.some(s => s.effectiveness === 'high')).length}
            </div>
            <div className="text-xs text-slate-400">{t('highImpact')}</div>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 justify-center"
      >
        {['all', 'browser', 'hardware', 'software', 'location'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all capitalize
              ${
                selectedCategory === category
                  ? 'bg-accent text-slate-900'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }
            `}
          >
            {category === 'all' ? t('allIssues') : tCategories(category)}
            {category !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {recommendations.filter(r => r.category === category).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredRecommendations.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{t('noIssuesFound')}</h3>
              <p className="text-slate-400">
                {selectedCategory === 'all'
                  ? t('greatJob')
                  : `No issues detected in ${tCategories(selectedCategory).toLowerCase()}`}
              </p>
            </motion.div>
          ) : (
            filteredRecommendations.map(rec => {
              const priorityStyle = getPriorityStyle(rec.priority);
              const isExpanded = expandedRecommendations.has(rec.id);
              const showDetail = showDetails.has(rec.id);

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`
                    rounded-2xl border p-6 cursor-pointer transition-all
                    ${priorityStyle.bgColor} ${priorityStyle.borderColor}
                    hover:border-white/20
                    ${isExpanded ? 'ring-2 ring-white/10' : ''}
                  `}
                  onClick={() => toggleExpanded(rec.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${priorityStyle.bgColor}`}>
                        <AlertCircle className={`w-5 h-5 ${priorityStyle.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full capitalize ${priorityStyle.textColor} ${priorityStyle.bgColor}`}
                          >
                            {rec.priority}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white/10 rounded-full capitalize">{rec.category}</span>
                          <span className="text-xs px-2 py-1 bg-white/10 rounded-full">{rec.estimatedTime}</span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{rec.description}</p>

                        {/* Issues */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-white mb-2">{t('detectedIssues')}</h4>
                          <div className="space-y-1">
                            {rec.issues.map((issue, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                {issue}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {completedActions.has(rec.id) && <CheckCircle className="w-5 h-5 text-green-400" />}
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <Settings className="w-5 h-5 text-slate-400" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          {/* Solutions */}
                          <div>
                            <h4 className="text-sm font-medium text-white mb-3">{t('recommendedSolutions')}</h4>
                            <div className="space-y-3">
                              {rec.solutions.map((solution, idx) => {
                                const difficultyStyle = getDifficultyStyle(solution.difficulty);
                                const isCompleted = completedActions.has(`${rec.id}-${idx}`);

                                return (
                                  <div
                                    key={idx}
                                    className={`rounded-xl border p-4 ${isCompleted ? 'border-green-500/20 bg-green-500/5' : 'border-white/10 bg-white/5'}`}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium text-white">{solution.title}</h5>
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full ${difficultyStyle.bg} ${difficultyStyle.color}`}
                                        >
                                          {solution.difficulty}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-white/10 rounded-full">
                                          {tEffectiveness(`${solution.effectiveness}Effectiveness`)}
                                        </span>
                                      </div>
                                      {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
                                    </div>
                                    <p className="text-sm text-slate-300 mb-3">{solution.description}</p>

                                    {/* Steps */}
                                    <div className="mb-3">
                                      <h6 className="text-xs font-medium text-white mb-2">{t('steps')}</h6>
                                      <ol className="space-y-1">
                                        {solution.steps.map((step, stepIdx) => (
                                          <li key={stepIdx} className="text-xs text-slate-400 flex items-start gap-2">
                                            <span className="text-accent font-mono">{stepIdx + 1}.</span>
                                            <span>{step}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    </div>

                                    {/* Tools */}
                                    {solution.tools && solution.tools.length > 0 && (
                                      <div className="mb-3">
                                        <h6 className="text-xs font-medium text-white mb-2">{t('tools')}</h6>
                                        <div className="flex flex-wrap gap-2">
                                          {solution.tools.map((tool, toolIdx) => (
                                            <span
                                              key={toolIdx}
                                              className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full"
                                            >
                                              {tool}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          markCompleted(`${rec.id}-${idx}`);
                                          onApplyRecommendation?.(rec.id, idx);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                          isCompleted
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-accent text-slate-900 hover:bg-accent/80'
                                        }`}
                                      >
                                        {isCompleted ? t('completedCheck') : t('markAsComplete')}
                                      </button>
                                      <button
                                        onClick={() => toggleDetails(`${rec.id}-${idx}`)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                                      >
                                        {showDetail ? t('hideDetails') : t('showDetails')}
                                      </button>
                                    </div>

                                    {/* Additional Details */}
                                    {showDetails && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="mt-3 pt-3 border-t border-white/10 space-y-3"
                                      >
                                        <div>
                                          <h6 className="text-xs font-medium text-white mb-1">{t('risks')}</h6>
                                          <ul className="space-y-1">
                                            {rec.risks.map((risk, riskIdx) => (
                                              <li
                                                key={riskIdx}
                                                className="text-xs text-yellow-400 flex items-start gap-1"
                                              >
                                                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                {risk}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div>
                                          <h6 className="text-xs font-medium text-white mb-1">{t('benefits')}</h6>
                                          <ul className="space-y-1">
                                            {rec.benefits.map((benefit, benefitIdx) => (
                                              <li
                                                key={benefitIdx}
                                                className="text-xs text-green-400 flex items-start gap-1"
                                              >
                                                <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                {benefit}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Download Report */}
      {completedActions.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-accent rounded-lg font-medium text-slate-900 hover:bg-accent/80 transition-all">
            <Download size={16} />
            {t('downloadReport')}
          </button>
        </motion.div>
      )}
    </div>
  );
};
