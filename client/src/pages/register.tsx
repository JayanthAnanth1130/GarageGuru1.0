import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    activationCode: "",
    garageName: "",
    ownerName: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = formData.activationCode === "GG-ADMIN-2025";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData);
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="gradient-header text-primary-foreground min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/login")}
            className="text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Register</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-primary-foreground hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="activationCode" className="block text-sm font-medium mb-2">
              Activation Code
            </Label>
            <Input
              id="activationCode"
              type="text"
              placeholder="Enter activation code"
              value={formData.activationCode}
              onChange={(e) => handleInputChange("activationCode", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
            <p className="text-xs text-blue-200 mt-1">
              Use GG-ADMIN-2025 for Admin or GG-STAFF-2025 for Staff
            </p>
          </div>

          <div>
            <Label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
              required
            />
          </div>

          {isAdmin && (
            <>
              <div>
                <Label htmlFor="garageName" className="block text-sm font-medium mb-2">
                  Garage Name
                </Label>
                <Input
                  id="garageName"
                  type="text"
                  placeholder="Enter garage name"
                  value={formData.garageName}
                  onChange={(e) => handleInputChange("garageName", e.target.value)}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ownerName" className="block text-sm font-medium mb-2">
                  Owner Name
                </Label>
                <Input
                  id="ownerName"
                  type="text"
                  placeholder="Enter owner name"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange("ownerName", e.target.value)}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="bg-white/10 border-white/20 placeholder-white/70 text-white focus:border-white/50"
                  required
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-primary hover:bg-gray-100"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
