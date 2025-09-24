# AI API Integration Setup Guide

## Overview
This guide explains how to set up the OpenRouter.ai API integration for the Task Management app's AI summary feature.

## Prerequisites
- Salesforce org with API access
- OpenRouter.ai account
- Administrator access to your Salesforce org

## Steps

### 1. Get OpenRouter.ai API Key
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Create an account or sign in
3. Navigate to your dashboard
4. Generate a new API key
5. Copy the API key for later use

### 2. Configure External Credential and Named Credential in Salesforce

1. Create External Credential:
   - In Setup, navigate to Security → External Credentials
   - Click "New External Credential"
   - Enter:
        Label: ORAuth
        Name: ORAuth
        Authentication Protocol: Custom
        Click "Save"
     
    - Once saved, navigate to Principles and click "New"
        - Enter APIKey as the Parameter Name
        - Sequence Number is auto-populated to 1
        - Indentity Type is pre-selected as 'Named Principle'
        - Add an Authentication Parameter:
            - Name:  Authorization
            - Value: Bearer <Your API Key> (replace <Your API Key> with your actual key)
        - Click "Save"

     - Navigate to Custom Header, click "New"
        - Enter 
            Name:  Authorization
            Value: Bearer <Your API Key> (replace <Your API Key> with your actual key) 
            Sequence Number: auto-populated to 1
        - Click "Save"


2. Create Named Credential:
   - In Setup, navigate to Security → Named Credentials
   - Click "New Named Credential"
   - Enter:
     Label: ORCred
     Name: ORCred
     URL: https://openrouter.ai/api/v1
     Associate with External Credential: ORAuth
     Uncheck "Generate Authorization Header"
   - Click "Save"

3. Configure Permission Set:
   - In Setup, navigate to Security → Permission Sets
   - Click "New"
   - Enter:
     Label: ORAccess
     API Name: ORAccess
     
   - Under System Permissions:
     - Enable "API Enabled"
   - Under External Credential Access:
     - Add the External Credential "ORAuth"
   - Save the Permission Set

4. Assign Permission Set:
   - Navigate to the Permission Set you just created
   - Click "Manage Assignments"
   - Add your user
   - Click "Assign"

### 4. Validate Setup

1. Create a new task in the Task Management app
2. The AI summary should be generated automatically
3. Check the debug logs to ensure API calls are successful

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Check if the API key is active in OpenRouter.ai dashboard
   - Verify the API key in External Credential

2. **No AI Summary Generated**
   - Review error logs (Debug Logs or Apex exceptions) for authentication or connection failures.
   - Ensure API limits haven't been exceeded

3. **Named Credential Issues**
   - Verify the URL is correct
   - Test the connection using Postman or similar tool
   - Check Named Credential and External Credential permissions — ensure the running user has access via Permission Sets.
   

### Support

For additional support:
1. Check OpenRouter.ai documentation
2. Review Salesforce Named Credential documentation
3. Contact system administrator

## Security Considerations

- The API key is securely stored using External Credentials rather than hardcoding it in Apex or configuration. This ensures sensitive information is not exposed in code or metadata.
- Authentication (External Credential) is separated from the endpoint configuration (Named Credential), following Salesforce recommended best practices.
- Access to the External Credential is managed via Permission Sets, ensuring only authorized users or integrations can use the API key.
- Storing credentials externally allows for easier auditing, rotation, and compliance with organizational security policies.

