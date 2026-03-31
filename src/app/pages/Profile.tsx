"use client";

import { useAuth } from '@/app/components/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { UserProfile } from '@/app/types/index';
import Link from 'next/link';
import { useState } from 'react';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase() || 'U';
}

export function Profile() {
  const { userRole, user } = useAuth();
  const profile = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    avatar: '',
    bio: '',
    professionalism: '',
    rating: undefined as number | undefined,
    graduationYear: '',
    expertise: '',
    experienceYears: '',
    role: userRole,
  };
  const resolvedRole = profile?.role ?? userRole;
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? '');
  const [avatarName, setAvatarName] = useState('');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [professionalism, setProfessionalism] = useState(profile?.professionalism ?? '');
  const [rating, setRating] = useState(
    profile?.rating !== undefined ? profile.rating.toString() : ''
  );
  const [graduationYear, setGraduationYear] = useState(profile?.graduationYear ?? '');
  const [expertise, setExpertise] = useState(profile?.expertise ?? '');
  const [experienceYears, setExperienceYears] = useState(profile?.experienceYears ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const isDirty =
    name !== (profile?.name ?? '') ||
    email !== (profile?.email ?? '') ||
    avatar !== (profile?.avatar ?? '') ||
    bio !== (profile?.bio ?? '') ||
    professionalism !== (profile?.professionalism ?? '') ||
    rating !== (profile?.rating?.toString() ?? '') ||
    graduationYear !== (profile?.graduationYear ?? '') ||
    expertise !== (profile?.expertise ?? '') ||
    experienceYears !== (profile?.experienceYears ?? '') ||
    Boolean(avatarName);

  const resetForm = () => {
    setName(profile?.name ?? '');
    setEmail(profile?.email ?? '');
    setAvatar(profile?.avatar ?? '');
    setAvatarName('');
    setBio(profile?.bio ?? '');
    setProfessionalism(profile?.professionalism ?? '');
    setRating(profile?.rating !== undefined ? profile.rating.toString() : '');
    setGraduationYear(profile?.graduationYear ?? '');
    setExpertise(profile?.expertise ?? '');
    setExperienceYears(profile?.experienceYears ?? '');
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your profile.</p>
          <Link href="/login">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAvatarFile = (file: File | null) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        setAvatarName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedProfile: Partial<UserProfile> = {
      name,
      email,
      avatar,
      bio,
      professionalism,
      graduationYear,
      expertise,
      experienceYears,
    };
    
    // Only add rating if it's a valid number
    if (rating && !isNaN(Number(rating))) {
      updatedProfile.rating = Number(rating);
    }
    
    setIsEditing(false);
    setAvatarName('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-10">
        <Card className="bg-white max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {avatar ? <AvatarImage src={avatar} alt={name || 'User'} /> : null}
                  <AvatarFallback className="text-lg bg-[#1E3A8A] text-white">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="text-gray-900">Avatar</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                      disabled={!isEditing}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm ${
                        isEditing
                          ? 'border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Browse
                    </label>
                    <span className="text-xs text-gray-600 truncate">
                      {avatarName || 'No file selected'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-900">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio"
                  rows={4}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="professionalism" className="text-gray-900">Professional Title</Label>
                  <Input
                    id="professionalism"
                    value={professionalism}
                    onChange={(e) => setProfessionalism(e.target.value)}
                    placeholder="e.g. UX Designer, Math Tutor"
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating" className="text-gray-900">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="0.0"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {resolvedRole === 'student' ? (
                <div className="space-y-2">
                  <Label htmlFor="graduationYear" className="text-gray-900">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                    disabled={!isEditing}
                  />
                </div>
              ) : null}

              {resolvedRole === 'teacher' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expertise" className="text-gray-900">Expertise</Label>
                    <Input
                      id="expertise"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="e.g. Web Development, Data Science"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears" className="text-gray-900">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="e.g. 5"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label className="text-gray-900">Role</Label>
                <Input value={resolvedRole ?? ''} readOnly className="bg-gray-50" />
              </div>

              <div className="flex items-center gap-3">
                {isEditing ? (
                  <Button type="submit" className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                    Save Changes
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
                {isEditing ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#1E3A8A] text-[#1E3A8A]"
                    onClick={() => {
                      if (isDirty && !window.confirm('Discard your unsaved changes?')) {
                        return;
                      }
                      resetForm();
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Link href={userRole === 'admin' ? '/dashboard/admin' : `/dashboard/${userRole}`}>
                  <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}