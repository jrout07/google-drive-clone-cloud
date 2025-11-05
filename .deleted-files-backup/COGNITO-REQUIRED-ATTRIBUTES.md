# 🔐 AWS Cognito Required Attributes Configuration Guide

## 📋 Required Attributes for User Registration

When configuring your AWS Cognito User Pool, you need to choose which attributes are **required** vs **optional** for user registration.

### ✅ **Recommended Required Attributes for Google Drive Clone:**

| Attribute | Required? | Reason | Example |
|-----------|-----------|--------|---------|
| **Email** | ✅ **YES** | Essential for file sharing, notifications, password recovery | `user@example.com` |
| **Username** | ❌ **NO** | Optional - let users choose if they want a custom username | `john_doe` |
| **Given Name (First Name)** | ❌ **NO** | Nice to have for personalization, but not critical | `John` |
| **Family Name (Last Name)** | ❌ **NO** | Nice to have for full name display | `Doe` |
| **Phone Number** | ❌ **NO** | Skip for file storage app (adds SMS costs) | `+1234567890` |

### 🎯 **Final Recommendation:**

**ONLY require EMAIL** - Keep it simple for user registration!

---

## 🚀 AWS Console Configuration Steps

### Step 1: Sign-in Experience
```
✅ Email address (required)
✅ Username (optional) 
❌ Phone number (skip)
```

### Step 2: Required Attributes
```
✅ Email (required) - ONLY THIS ONE
❌ First name (optional)
❌ Last name (optional) 
❌ Phone number (skip)
```

### Step 3: Password Policy
```
Minimum length: 8 characters
✅ Require uppercase letters
✅ Require lowercase letters  
✅ Require numbers
❌ Require special characters (keep user-friendly)
```

---

## 💻 Code Implementation

### Current Backend Registration Handler:

```typescript
// backend/src/services/cognito.ts
async signUp(request: SignUpRequest): Promise<{ userId: string; needsConfirmation: boolean }> {
  const command = new AdminCreateUserCommand({
    UserPoolId: this.userPoolId,
    Username: request.username || request.email,
    UserAttributes: [
      // REQUIRED: Email (always send)
      { Name: 'email', Value: request.email },
      { Name: 'email_verified', Value: 'true' },
      
      // OPTIONAL: First/Last name (only if provided)
      ...(request.firstName ? [{ Name: 'given_name', Value: request.firstName }] : []),
      ...(request.lastName ? [{ Name: 'family_name', Value: request.lastName }] : []),
    ],
    TemporaryPassword: request.password,
    MessageAction: MessageActionType.SUPPRESS,
  });
  
  const result = await this.client.send(command);
  return { userId: result.User?.Username || '', needsConfirmation: false };
}
```

### Registration API Endpoint:

```typescript
// backend/src/controllers/auth.ts
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Optional fields can be undefined
    const signUpRequest: SignUpRequest = {
      email,
      password,
      username: username || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    };

    const result = await cognitoService.signUp(signUpRequest);
    // ... rest of implementation
  } catch (error) {
    // ... error handling
  }
};
```

---

## 🧪 Registration Examples

### Minimum Required Registration (Email + Password only):
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

### Full Registration (All optional fields):
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Registration with Custom Username:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "username": "jane_designer",
    "password": "SecurePass456"
  }'
```

---

## 🎨 Frontend Registration Form

### React Registration Component:
```tsx
// frontend/src/components/Auth/RegisterForm.tsx
const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',        // REQUIRED
    password: '',     // REQUIRED
    username: '',     // OPTIONAL
    firstName: '',    // OPTIONAL
    lastName: '',     // OPTIONAL
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only send non-empty optional fields
    const registrationData = {
      email: formData.email,
      password: formData.password,
      ...(formData.username && { username: formData.username }),
      ...(formData.firstName && { firstName: formData.firstName }),
      ...(formData.lastName && { lastName: formData.lastName }),
    };

    try {
      await authAPI.register(registrationData);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* REQUIRED FIELDS */}
      <TextField
        required
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      
      <TextField
        required
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />

      {/* OPTIONAL FIELDS */}
      <TextField
        label="Username (optional)"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      
      <TextField
        label="First Name (optional)"
        value={formData.firstName}
        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
      />
      
      <TextField
        label="Last Name (optional)"
        value={formData.lastName}
        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
      />

      <Button type="submit">Register</Button>
    </form>
  );
};
```

---

## 📊 AWS CLI Command for User Pool Creation

```bash
# Create User Pool with only EMAIL as required attribute
aws cognito-idp create-user-pool \
    --pool-name gdrive-clone-users \
    --region us-west-2 \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false
        }
    }' \
    --username-attributes email \
    --alias-attributes email \
    --auto-verified-attributes email \
    --schema '[
        {
            "Name": "email",
            "AttributeDataType": "String",
            "Required": true,
            "Mutable": true
        },
        {
            "Name": "given_name",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true
        },
        {
            "Name": "family_name",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true
        }
    ]' \
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "DefaultEmailSubject": "Verify your Google Drive Clone account",
        "DefaultEmailMessage": "Your verification code is {####}"
    }' \
    --admin-create-user-config '{
        "AllowAdminCreateUserOnly": false,
        "UnusedAccountValidityDays": 7
    }'
```

---

## ✅ Summary & Best Practices

### **Required vs Optional Strategy:**

1. **✅ REQUIRED: Email only**
   - Critical for authentication
   - Used for password recovery
   - Essential for file sharing notifications

2. **❌ OPTIONAL: Everything else**
   - Username (let users choose)
   - First/Last name (nice to have)
   - Phone number (skip entirely)

### **Benefits of This Approach:**
- ✅ **Low friction** user registration
- ✅ **Higher conversion** rates
- ✅ **Flexible** user experience
- ✅ **Cost effective** (no SMS costs)
- ✅ **GDPR compliant** (minimal data collection)

### **User Experience:**
- Users can register with just email + password
- Optional fields enhance personalization
- Username provides memorable login alternative
- Simple, clean registration flow

This configuration gives you the perfect balance of functionality and simplicity for your Google Drive Clone! 🎉
