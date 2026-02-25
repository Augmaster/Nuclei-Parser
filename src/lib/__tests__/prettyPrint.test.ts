import { describe, it, expect } from 'vitest';
import { parseHttpMessage, prettyPrintBody, detectLanguage } from '../prettyPrint';

describe('parseHttpMessage', () => {
  it('should split headers and body on double newline', () => {
    const raw = 'GET / HTTP/1.1\r\nHost: example.com\r\n\r\n{"key":"value"}';
    const result = parseHttpMessage(raw);
    expect(result.headers).toBe('GET / HTTP/1.1\r\nHost: example.com');
    expect(result.body).toBe('{"key":"value"}');
  });

  it('should handle unix-style line endings', () => {
    const raw = 'GET / HTTP/1.1\nHost: example.com\n\n<html><body>hello</body></html>';
    const result = parseHttpMessage(raw);
    expect(result.headers).toBe('GET / HTTP/1.1\nHost: example.com');
    expect(result.body).toBe('<html><body>hello</body></html>');
  });

  it('should return entire text as headers when no body exists', () => {
    const raw = 'GET / HTTP/1.1\r\nHost: example.com';
    const result = parseHttpMessage(raw);
    expect(result.headers).toBe('GET / HTTP/1.1\r\nHost: example.com');
    expect(result.body).toBe('');
  });

  it('should handle empty input', () => {
    const result = parseHttpMessage('');
    expect(result.headers).toBe('');
    expect(result.body).toBe('');
  });
});

describe('detectLanguage', () => {
  it('should detect JSON from content', () => {
    expect(detectLanguage('{"key": "value"}')).toBe('json');
  });

  it('should detect JSON array', () => {
    expect(detectLanguage('[{"id": 1}]')).toBe('json');
  });

  it('should detect HTML from content', () => {
    expect(detectLanguage('<!DOCTYPE html><html><body></body></html>')).toBe('html');
    expect(detectLanguage('<html><head></head></html>')).toBe('html');
  });

  it('should detect XML from content', () => {
    expect(detectLanguage('<?xml version="1.0"?><root><item/></root>')).toBe('xml');
  });

  it('should return plaintext for unknown content', () => {
    expect(detectLanguage('just some random text')).toBe('plaintext');
  });

  it('should detect from Content-Type header', () => {
    expect(detectLanguage('{}', 'application/json')).toBe('json');
    expect(detectLanguage('<p>hi</p>', 'text/html; charset=utf-8')).toBe('html');
    expect(detectLanguage('<r/>', 'application/xml')).toBe('xml');
  });
});

describe('prettyPrintBody', () => {
  it('should pretty-print JSON', () => {
    const result = prettyPrintBody('{"a":1,"b":{"c":2}}', 'json');
    expect(result).toBe('{\n  "a": 1,\n  "b": {\n    "c": 2\n  }\n}');
  });

  it('should return original on invalid JSON', () => {
    const input = '{broken json';
    expect(prettyPrintBody(input, 'json')).toBe(input);
  });

  it('should return body unchanged for plaintext', () => {
    const input = 'just text';
    expect(prettyPrintBody(input, 'plaintext')).toBe(input);
  });
});
