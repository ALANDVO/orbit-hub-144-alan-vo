/** Audit Components */

import { cn, formatRelativeTime, getSeverityColor, getSeverityBg, getScoreColor } from '../../utils/helpers';
import { AlertTriangle, Info, CheckCircle, Ban, FileText, Globe } from 'lucide-react';
import type { DesignAudit, AuditFinding } from '../../types/api';
import { Button, Badge, Card, CardHeader, CardContent } from '../ui/components';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui';

interface AuditCardProps {
  audit: DesignAudit;
  onView?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function AuditCard({ audit, onView, onDelete }: AuditCardProps) {
  const scores = {
    a11y: audit.a11y_score,
    performance: audit.performance_score,
    theming: audit.theming_score,
    responsive: audit.responsive_score,
    integrity: audit.integrity_score,
    i18n: audit.i18n_score,
  };
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = 24;
  const pct = Math.round((totalScore / maxScore) * 100);

  const severityCounts = {
    violation: audit.findings?.items.filter(f => f.severity === 'violation').length || 0,
    warning: audit.findings?.items.filter(f => f.severity === 'warning').length || 0,
    advisory: audit.findings?.items.filter(f => f.severity === 'advisory').length || 0,
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{audit.target_path}</span>
            {audit.is_rtl && <Badge variant="info" size="sm">RTL</Badge>}
            {audit.target_url && (
              <a href={audit.target_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="View live page">
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">Audited {formatRelativeTime(audit.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className={cn('text-2xl font-bold', getScoreColor(totalScore, maxScore))}>{totalScore}/{maxScore}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{pct}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { key: 'a11y', label: 'A11y', score: scores.a11y },
            { key: 'performance', label: 'Perf', score: scores.performance },
            { key: 'theming', label: 'Theme', score: scores.theming },
            { key: 'responsive', label: 'Resp', score: scores.responsive },
            { key: 'integrity', label: 'Integ', score: scores.integrity },
            { key: 'i18n', label: 'i18n', score: scores.i18n },
          ].map(({ key, label, score }) => (
            <div key={key} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
              <p className={cn('text-lg font-bold', getScoreColor(score))}>{score}/4</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Findings summary */}
        {audit.findings && audit.findings.total > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {severityCounts.violation > 0 && (
              <Badge variant="error" size="sm">{severityCounts.violation} violations</Badge>
            )}
            {severityCounts.warning > 0 && (
              <Badge variant="warning" size="sm">{severityCounts.warning} warnings</Badge>
            )}
            {severityCounts.advisory > 0 && (
              <Badge variant="info" size="sm">{severityCounts.advisory} advisories</Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onView?.(audit.id)}>
            <FileText className="h-4 w-4 mr-1" /> View Details
          </Button>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(audit.id)} className="text-red-600 hover:text-red-700">
              <Ban className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Audit Detail View
interface AuditDetailProps {
  audit: DesignAudit;
  onBack: () => void;
  onDelete: () => void;
}

export function AuditDetail({ audit, onBack, onDelete }: AuditDetailProps) {
  const scores = {
    a11y: audit.a11y_score,
    performance: audit.performance_score,
    theming: audit.theming_score,
    responsive: audit.responsive_score,
    integrity: audit.integrity_score,
    i18n: audit.i18n_score,
  };
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = 24;

  const findings = audit.findings?.items || [];
  const byCategory = findings.reduce((acc, f) => {
    acc[f.category] = acc[f.category] || [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, AuditFinding[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <button onClick={onBack} className="mb-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Audit Results</h1>
            {audit.is_rtl && <Badge variant="info">RTL Page</Badge>}
          </div>
          <p className="text-slate-500 dark:text-slate-400">{audit.target_path}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className={cn('text-4xl font-bold', getScoreColor(totalScore, maxScore))}>{totalScore}/{maxScore}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Overall Score</p>
          </div>
          <Button variant="danger" onClick={onDelete}><Ban className="h-4 w-4 mr-2" />Delete</Button>
        </div>
      </div>

      {/* Score breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Score Breakdown</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { key: 'a11y', label: 'Accessibility', score: scores.a11y },
              { key: 'performance', label: 'Performance', score: scores.performance },
              { key: 'theming', label: 'Theming', score: scores.theming },
              { key: 'responsive', label: 'Responsive', score: scores.responsive },
              { key: 'integrity', label: 'Integrity', score: scores.integrity },
              { key: 'i18n', label: 'Internationalization', score: scores.i18n },
            ].map(({ key, label, score }) => (
              <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                <p className={cn('text-3xl font-bold', getScoreColor(score))}>{score}/4</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Findings */}
      {findings.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Findings ({findings.length})</h2>
              <div className="flex items-center gap-2">
                <Badge variant="error" size="sm">{findings.filter(f => f.severity === 'violation').length} violations</Badge>
                <Badge variant="warning" size="sm">{findings.filter(f => f.severity === 'warning').length} warnings</Badge>
                <Badge variant="info" size="sm">{findings.filter(f => f.severity === 'advisory').length} advisories</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(byCategory).map(([category, categoryFindings]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="flex items-center justify-between">
                    <span className="font-medium capitalize">{category}</span>
                    <Badge variant={categoryFindings.some(f => f.severity === 'violation') ? 'error' : categoryFindings.some(f => f.severity === 'warning') ? 'warning' : 'info'} size="sm">
                      {categoryFindings.length}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {categoryFindings.map((finding, index) => (
                        <FindingItem key={index} finding={finding} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No issues found</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">This page passes all design audit checks.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FindingItemProps {
  finding: AuditFinding;
}

function FindingItem({ finding }: FindingItemProps) {
  const icons = {
    violation: <Ban className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    advisory: <Info className="h-4 w-4" />,
  };

  return (
    <div className={cn('p-3 rounded-lg border-l-4', getSeverityBg(finding.severity), `border-${finding.severity === 'violation' ? 'red' : finding.severity === 'warning' ? 'amber' : 'blue'}-500`)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', getSeverityColor(finding.severity))}>
          {icons[finding.severity]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">{finding.title}</h4>
            <Badge variant={finding.severity === 'violation' ? 'error' : finding.severity === 'warning' ? 'warning' : 'info'} size="sm">
              {finding.severity}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{finding.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">{finding.selector}</span>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">{finding.property}: {finding.value}</span>
            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded font-mono">
              → {finding.logical_equivalent}
            </span>
            {finding.line && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">line {finding.line}</span>}
          </div>
          {finding.line && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400"><strong>Line:</strong> {finding.line}</p>
          )}
        </div>
      </div>
    </div>
  );
}