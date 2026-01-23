// OWASP Cheat Sheet mappings by CWE ID
export const owaspCheatSheets: Record<string, { title: string; url: string }> = {
  'CWE-79': {
    title: 'Cross Site Scripting Prevention',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
  },
  'CWE-89': {
    title: 'SQL Injection Prevention',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
  },
  'CWE-22': {
    title: 'File Path Traversal Prevention',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html',
  },
  'CWE-78': {
    title: 'OS Command Injection Defense',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html',
  },
  'CWE-611': {
    title: 'XML External Entity Prevention',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html',
  },
  'CWE-918': {
    title: 'Server Side Request Forgery Prevention',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html',
  },
  'CWE-352': {
    title: 'Cross-Site Request Forgery Prevention',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
  },
  'CWE-287': {
    title: 'Authentication Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
  },
  'CWE-306': {
    title: 'Authentication Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
  },
  'CWE-862': {
    title: 'Authorization Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
  },
  'CWE-863': {
    title: 'Authorization Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
  },
  'CWE-502': {
    title: 'Deserialization Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html',
  },
  'CWE-601': {
    title: 'Unvalidated Redirects and Forwards',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html',
  },
  'CWE-94': {
    title: 'Injection Prevention',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html',
  },
  'CWE-434': {
    title: 'File Upload Security',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html',
  },
  'CWE-798': {
    title: 'Secrets Management',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
  },
  'CWE-312': {
    title: 'Cryptographic Storage',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html',
  },
  'CWE-319': {
    title: 'Transport Layer Security',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html',
  },
  'CWE-384': {
    title: 'Session Management',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
  },
  'CWE-200': {
    title: 'Error Handling',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html',
  },
  'CWE-532': {
    title: 'Logging Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html',
  },
};

// HackTricks pages mapped by Nuclei tags
export const hacktricksPages: Record<string, { title: string; url: string }> = {
  'xss': {
    title: 'XSS - Cross Site Scripting',
    url: 'https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting',
  },
  'sqli': {
    title: 'SQL Injection',
    url: 'https://book.hacktricks.xyz/pentesting-web/sql-injection',
  },
  'ssrf': {
    title: 'SSRF - Server Side Request Forgery',
    url: 'https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery',
  },
  'xxe': {
    title: 'XXE - XML External Entity',
    url: 'https://book.hacktricks.xyz/pentesting-web/xxe-xee-xml-external-entity',
  },
  'lfi': {
    title: 'File Inclusion/Path Traversal',
    url: 'https://book.hacktricks.xyz/pentesting-web/file-inclusion',
  },
  'rfi': {
    title: 'File Inclusion/Path Traversal',
    url: 'https://book.hacktricks.xyz/pentesting-web/file-inclusion',
  },
  'rce': {
    title: 'Command Injection',
    url: 'https://book.hacktricks.xyz/pentesting-web/command-injection',
  },
  'ssti': {
    title: 'SSTI - Server Side Template Injection',
    url: 'https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection',
  },
  'idor': {
    title: 'IDOR - Insecure Direct Object Reference',
    url: 'https://book.hacktricks.xyz/pentesting-web/idor',
  },
  'csrf': {
    title: 'CSRF - Cross Site Request Forgery',
    url: 'https://book.hacktricks.xyz/pentesting-web/csrf-cross-site-request-forgery',
  },
  'crlf': {
    title: 'CRLF Injection',
    url: 'https://book.hacktricks.xyz/pentesting-web/crlf-0d-0a',
  },
  'redirect': {
    title: 'Open Redirect',
    url: 'https://book.hacktricks.xyz/pentesting-web/open-redirect',
  },
  'open-redirect': {
    title: 'Open Redirect',
    url: 'https://book.hacktricks.xyz/pentesting-web/open-redirect',
  },
  'upload': {
    title: 'File Upload',
    url: 'https://book.hacktricks.xyz/pentesting-web/file-upload',
  },
  'file-upload': {
    title: 'File Upload',
    url: 'https://book.hacktricks.xyz/pentesting-web/file-upload',
  },
  'deserialization': {
    title: 'Deserialization',
    url: 'https://book.hacktricks.xyz/pentesting-web/deserialization',
  },
  'cors': {
    title: 'CORS Misconfiguration',
    url: 'https://book.hacktricks.xyz/pentesting-web/cors-bypass',
  },
  'jwt': {
    title: 'JWT Attacks',
    url: 'https://book.hacktricks.xyz/pentesting-web/hacking-jwt-json-web-tokens',
  },
  'graphql': {
    title: 'GraphQL',
    url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/graphql',
  },
  'nosql': {
    title: 'NoSQL Injection',
    url: 'https://book.hacktricks.xyz/pentesting-web/nosql-injection',
  },
  'ldap': {
    title: 'LDAP Injection',
    url: 'https://book.hacktricks.xyz/pentesting-web/ldap-injection',
  },
  'websocket': {
    title: 'WebSocket Attacks',
    url: 'https://book.hacktricks.xyz/pentesting-web/cross-site-websocket-hijacking-cswsh',
  },
  'prototype-pollution': {
    title: 'Prototype Pollution',
    url: 'https://book.hacktricks.xyz/pentesting-web/deserialization/nodejs-proto-prototype-pollution',
  },
  'clickjacking': {
    title: 'Clickjacking',
    url: 'https://book.hacktricks.xyz/pentesting-web/clickjacking',
  },
  'header-injection': {
    title: 'HTTP Header Injection',
    url: 'https://book.hacktricks.xyz/pentesting-web/crlf-0d-0a',
  },
  'subdomain-takeover': {
    title: 'Subdomain Takeover',
    url: 'https://book.hacktricks.xyz/pentesting-web/domain-subdomain-takeover',
  },
  'takeover': {
    title: 'Subdomain Takeover',
    url: 'https://book.hacktricks.xyz/pentesting-web/domain-subdomain-takeover',
  },
  'oauth': {
    title: 'OAuth Vulnerabilities',
    url: 'https://book.hacktricks.xyz/pentesting-web/oauth-to-account-takeover',
  },
  'cache-poisoning': {
    title: 'Cache Poisoning',
    url: 'https://book.hacktricks.xyz/pentesting-web/cache-deception',
  },
  'request-smuggling': {
    title: 'HTTP Request Smuggling',
    url: 'https://book.hacktricks.xyz/pentesting-web/http-request-smuggling',
  },
  'host-header': {
    title: 'Host Header Attacks',
    url: 'https://book.hacktricks.xyz/pentesting-web/host-header-injection',
  },
  'race-condition': {
    title: 'Race Condition',
    url: 'https://book.hacktricks.xyz/pentesting-web/race-condition',
  },
};

// PortSwigger Web Security Academy pages
export const portswiggerPages: Record<string, { title: string; url: string }> = {
  'xss': {
    title: 'Cross-site scripting',
    url: 'https://portswigger.net/web-security/cross-site-scripting',
  },
  'sqli': {
    title: 'SQL injection',
    url: 'https://portswigger.net/web-security/sql-injection',
  },
  'ssrf': {
    title: 'Server-side request forgery',
    url: 'https://portswigger.net/web-security/ssrf',
  },
  'xxe': {
    title: 'XML external entity injection',
    url: 'https://portswigger.net/web-security/xxe',
  },
  'lfi': {
    title: 'Path traversal',
    url: 'https://portswigger.net/web-security/file-path-traversal',
  },
  'csrf': {
    title: 'Cross-site request forgery',
    url: 'https://portswigger.net/web-security/csrf',
  },
  'cors': {
    title: 'Cross-origin resource sharing',
    url: 'https://portswigger.net/web-security/cors',
  },
  'clickjacking': {
    title: 'Clickjacking',
    url: 'https://portswigger.net/web-security/clickjacking',
  },
  'websocket': {
    title: 'WebSockets',
    url: 'https://portswigger.net/web-security/websockets',
  },
  'deserialization': {
    title: 'Insecure deserialization',
    url: 'https://portswigger.net/web-security/deserialization',
  },
  'ssti': {
    title: 'Server-side template injection',
    url: 'https://portswigger.net/web-security/server-side-template-injection',
  },
  'request-smuggling': {
    title: 'HTTP request smuggling',
    url: 'https://portswigger.net/web-security/request-smuggling',
  },
  'oauth': {
    title: 'OAuth authentication',
    url: 'https://portswigger.net/web-security/oauth',
  },
  'jwt': {
    title: 'JWT attacks',
    url: 'https://portswigger.net/web-security/jwt',
  },
  'prototype-pollution': {
    title: 'Prototype pollution',
    url: 'https://portswigger.net/web-security/prototype-pollution',
  },
  'graphql': {
    title: 'GraphQL API vulnerabilities',
    url: 'https://portswigger.net/web-security/graphql',
  },
  'race-condition': {
    title: 'Race conditions',
    url: 'https://portswigger.net/web-security/race-conditions',
  },
  'nosql': {
    title: 'NoSQL injection',
    url: 'https://portswigger.net/web-security/nosql-injection',
  },
  'cache-poisoning': {
    title: 'Web cache poisoning',
    url: 'https://portswigger.net/web-security/web-cache-poisoning',
  },
  'host-header': {
    title: 'HTTP Host header attacks',
    url: 'https://portswigger.net/web-security/host-header',
  },
  'rce': {
    title: 'OS command injection',
    url: 'https://portswigger.net/web-security/os-command-injection',
  },
  'upload': {
    title: 'File upload vulnerabilities',
    url: 'https://portswigger.net/web-security/file-upload',
  },
};

// Technology-specific security documentation
export const technologyDocs: Record<string, { title: string; url: string }> = {
  'apache': {
    title: 'Apache Security Tips',
    url: 'https://httpd.apache.org/docs/2.4/misc/security_tips.html',
  },
  'nginx': {
    title: 'NGINX Security Controls',
    url: 'https://docs.nginx.com/nginx/admin-guide/security-controls/',
  },
  'wordpress': {
    title: 'WordPress Security',
    url: 'https://developer.wordpress.org/advanced-administration/security/',
  },
  'drupal': {
    title: 'Drupal Security',
    url: 'https://www.drupal.org/docs/security-in-drupal',
  },
  'joomla': {
    title: 'Joomla Security Checklist',
    url: 'https://docs.joomla.org/Security_Checklist',
  },
  'jenkins': {
    title: 'Jenkins Security',
    url: 'https://www.jenkins.io/doc/book/security/',
  },
  'docker': {
    title: 'Docker Security',
    url: 'https://docs.docker.com/engine/security/',
  },
  'kubernetes': {
    title: 'Kubernetes Security',
    url: 'https://kubernetes.io/docs/concepts/security/',
  },
  'aws': {
    title: 'AWS Security Best Practices',
    url: 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html',
  },
  'azure': {
    title: 'Azure Security Documentation',
    url: 'https://docs.microsoft.com/en-us/azure/security/',
  },
  'gcp': {
    title: 'Google Cloud Security',
    url: 'https://cloud.google.com/security/best-practices',
  },
  'mysql': {
    title: 'MySQL Security',
    url: 'https://dev.mysql.com/doc/refman/8.0/en/security.html',
  },
  'postgresql': {
    title: 'PostgreSQL Security',
    url: 'https://www.postgresql.org/docs/current/auth-methods.html',
  },
  'mongodb': {
    title: 'MongoDB Security',
    url: 'https://www.mongodb.com/docs/manual/security/',
  },
  'redis': {
    title: 'Redis Security',
    url: 'https://redis.io/docs/management/security/',
  },
  'elasticsearch': {
    title: 'Elasticsearch Security',
    url: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/secure-cluster.html',
  },
  'tomcat': {
    title: 'Apache Tomcat Security',
    url: 'https://tomcat.apache.org/tomcat-10.0-doc/security-howto.html',
  },
  'spring': {
    title: 'Spring Security',
    url: 'https://spring.io/projects/spring-security',
  },
  'nodejs': {
    title: 'Node.js Security Best Practices',
    url: 'https://nodejs.org/en/docs/guides/security/',
  },
  'php': {
    title: 'PHP Security',
    url: 'https://www.php.net/manual/en/security.php',
  },
};

export interface ExternalResource {
  type: 'owasp' | 'hacktricks' | 'portswigger' | 'technology' | 'generic';
  title: string;
  url: string;
  relevance: 'high' | 'medium' | 'low';
}

/**
 * Get relevant external resources based on CWE IDs
 */
export function getResourcesByCWE(cweIds: string[]): ExternalResource[] {
  const resources: ExternalResource[] = [];

  for (const cweId of cweIds) {
    const normalizedId = cweId.toUpperCase();
    const owasp = owaspCheatSheets[normalizedId];
    if (owasp) {
      resources.push({
        type: 'owasp',
        title: `OWASP: ${owasp.title}`,
        url: owasp.url,
        relevance: 'high',
      });
    }
  }

  return resources;
}

/**
 * Get relevant external resources based on Nuclei tags
 */
export function getResourcesByTags(tags: string[]): ExternalResource[] {
  const resources: ExternalResource[] = [];
  const addedUrls = new Set<string>();

  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase();

    // HackTricks
    const hacktricks = hacktricksPages[normalizedTag];
    if (hacktricks && !addedUrls.has(hacktricks.url)) {
      resources.push({
        type: 'hacktricks',
        title: `HackTricks: ${hacktricks.title}`,
        url: hacktricks.url,
        relevance: 'high',
      });
      addedUrls.add(hacktricks.url);
    }

    // PortSwigger
    const portswigger = portswiggerPages[normalizedTag];
    if (portswigger && !addedUrls.has(portswigger.url)) {
      resources.push({
        type: 'portswigger',
        title: `PortSwigger: ${portswigger.title}`,
        url: portswigger.url,
        relevance: 'high',
      });
      addedUrls.add(portswigger.url);
    }

    // Technology docs
    const techDoc = technologyDocs[normalizedTag];
    if (techDoc && !addedUrls.has(techDoc.url)) {
      resources.push({
        type: 'technology',
        title: techDoc.title,
        url: techDoc.url,
        relevance: 'medium',
      });
      addedUrls.add(techDoc.url);
    }
  }

  return resources;
}

/**
 * Get all relevant external resources for a finding
 */
export function getExternalResources(
  cweIds: string[],
  tags: string[]
): ExternalResource[] {
  const cweResources = getResourcesByCWE(cweIds);
  const tagResources = getResourcesByTags(tags);

  // Merge and deduplicate
  const allResources = [...cweResources, ...tagResources];
  const uniqueUrls = new Set<string>();
  const unique: ExternalResource[] = [];

  for (const resource of allResources) {
    if (!uniqueUrls.has(resource.url)) {
      uniqueUrls.add(resource.url);
      unique.push(resource);
    }
  }

  // Sort by relevance
  return unique.sort((a, b) => {
    const relevanceOrder = { high: 0, medium: 1, low: 2 };
    return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
  });
}
