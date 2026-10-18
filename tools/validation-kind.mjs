// Classify the actual failed assertion when audited; do not guess mixed-suite failures.
export function validationFailureKind(name,status,stderr,catalog){
 if(status==='pass'||status==='deferred')return null;
 if(status==='timeout')return'performance';
 if(status==='stale')return'historical-expectation';
 for(const rule of [...(catalog.suites[name]?.failureRules||[]),...(catalog.failureRules||[])])if(rule.match&&stderr.includes(rule.match))return rule.kind;
 const kinds=catalog.suites[name]?.kinds||catalog.defaultKinds;return kinds.length===1?kinds[0]:'unclassified';
}
