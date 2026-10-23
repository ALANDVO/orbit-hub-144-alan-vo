/** Craft Floor Components */

import { cn, getSeverityColor, getSeverityBg } from '../../utils/helpers';
import { Ban, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { CraftFloorViolation, CraftFloorCheckResponse } from '../../types/api';
import { Button, Badge, Card, CardHeader, CardContent, Textarea, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui';
interface CraftFloorCheckFormProps {
  onCheck: (request: { file_path: string; content_before: string; content_after: string }) => Promise<void>;
  loading?: boolean;
  result?: CraftFloorCheckResponse | null;
}

export function CraftFloorCheckForm({ onCheck, loading, result }: CraftFloorCheckFormProps) {
  const [filePath, setFilePath] = useState('');
  const [contentBefore, setContentBefore] = useState('');
  const [contentAfter, setContentAfter] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCheck({ file_path: filePath, content_before: contentBefore, content_after: contentAfter });
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Craft Floor Check</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Check your UI changes against quality rules before committing.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file-path" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              File Path
            </label>
            <input
              id="file-path"
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="src/components/Button.tsx"
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="content-before" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Content Before
              </label>
              <Textarea
                id="content-before"
                value={contentBefore}
                onChange={(e) => setContentBefore(e.target.value)}
                placeholder="Paste the original file content..."
                rows={10}
              />
            </div>
            <div>
              <label htmlFor="content-after" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Content After (Proposed)
              </label>
              <Textarea
                id="content-after"
                value={contentAfter}
                onChange={(e) => setContentAfter(e.target.value)}
                placeholder="Paste the modified file content..."
                rows={10}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Checking...' : 'Run Craft Floor Check'}
          </Button>
        </form>

        {result && <CraftFloorResult result={result} />}
      </CardContent>
    </Card>
  );
}

interface CraftFloorResultProps {
  result: CraftFloorCheckResponse;
}

export function CraftFloorResult({ result }: CraftFloorResultProps) {
  const { passed, violations, warnings, advisories } = result;

  return (
    <div className="mt-6 space-y-4">
      {/* Overall status */}
      <div className={cn('p-4 rounded-lg flex items-center gap-3', passed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800')}>
        {passed ? (
          <>
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-300">All checks passed</p>
              <p className="text-sm text-green-600 dark:text-green-400">No craft floor violations detected.</p>
            </div>
          </>
        ) : (
          <>
            <Ban className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">Craft floor violations found</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {violations.length} violation{violations.length !== 1 ? 's' : ''}, {warnings.length} warning{warnings.length !== 1 ? 's' : ''}, {advisories.length} advisory{advisories.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <Ban className="h-5 w-5" />
              Violations ({violations.length})
            </h3>
            <Badge variant="error">Must Fix</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" className="w-full">
              {violations.map((v, i) => (
                <AccordionItem key={i} value={`${v.rule_id}-${i}`}>
                  <AccordionTrigger className="flex items-center justify-between">
                    <span className="font-medium">{v.title}</span>
                    <Badge variant="error" size="sm">{v.severity}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ViolationDetail violation={v} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              Warnings ({warnings.length})
            </h3>
            <Badge variant="warning">Should Fix</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" className="w-full">
              {warnings.map((v, i) => (
                <AccordionItem key={i} value={`${v.rule_id}-${i}`}>
                  <AccordionTrigger className="flex items-center justify-between">
                    <span className="font-medium">{v.title}</span>
                    <Badge variant="warning" size="sm">{v.severity}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ViolationDetail violation={v} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Advisories */}
      {advisories.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Info className="h-5 w-5" />
              Advisories ({advisories.length})
            </h3>
            <Badge variant="info">Consider</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" className="w-full">
              {advisories.map((v, i) => (
                <AccordionItem key={i} value={`${v.rule_id}-${i}`}>
                  <AccordionTrigger className="flex items-center justify-between">
                    <span className="font-medium">{v.title}</span>
                    <Badge variant="info" size="sm">{v.severity}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ViolationDetail violation={v} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ViolationDetailProps {
  violation: CraftFloorViolation;
}

function ViolationDetail({ violation }: ViolationDetailProps) {
  const icons = {
    ban: <Ban className="h-4 w-4" />,
    violation: <Ban className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    advisory: <Info className="h-4 w-4" />,
  };

  return (
    <div className={cn('p-3 space-y-2', getSeverityBg(violation.severity))}>
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', getSeverityColor(violation.severity))}>
          {icons[violation.severity as keyof typeof icons] || icons.violation}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-700 dark:text-slate-300">{violation.description}</p>
          {violation.location && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{violation.location}</p>
          )}
          {violation.fix_guidance && (
            <div className="mt-2 p-2 bg-white/50 dark:bg-slate-700/50 rounded text-sm">
              <strong className="text-slate-900 dark:text-slate-100">Fix: </strong>
              <span className="text-slate-600 dark:text-slate-400">{violation.fix_guidance}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Rules List
interface CraftFloorRulesProps {
  rules: CraftFloorViolation[];
}

export function CraftFloorRules({ rules }: CraftFloorRulesProps) {
  const byCategory = rules.reduce((acc, rule) => {
    acc[rule.category] = acc[rule.category] || [];
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, CraftFloorViolation[]>);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Craft Floor Rules</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {rules.length} rules defined
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="multiple" className="w-full">
          {Object.entries(byCategory as Record<string, CraftFloorViolation[]>).map(([category, categoryRules]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="flex items-center justify-between">
                <span className="font-medium capitalize">{category}</span>
                <Badge variant="default" size="sm">{categoryRules.length} rules</Badge>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {categoryRules.map((rule, index) => (
                    <div key={index} className={cn('p-3 rounded-lg', getSeverityBg(rule.severity))}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={rule.severity === 'ban' ? 'error' : rule.severity === 'warning' ? 'warning' : 'info'} size="sm">
                          {rule.severity}
                        </Badge>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{rule.rule_id}</span>
                      </div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">{rule.title}</h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{rule.description}</p>
                      {rule.fix_guidance && (
                        <p className="mt-2 text-sm text-green-700 dark:text-green-400"><strong>Fix:</strong> {rule.fix_guidance}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}