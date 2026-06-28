import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "@/lib/utils/session";
import { useAuth } from "@/app/context/auth";
import { useAppState } from "@/app/context/store";

export interface ApiChild {
  _id: string;
  name: string;
  roll_no?: string;
  class_id?: {
    _id: string;
    name: string;
    section: string;
  };
  photo_url?: string;
  gender?: string;
}

export function useParent(options?: { skip?: boolean }) {
  const { user } = useAuth();
  const { academicYear } = useAppState();
  const [children, setChildren] = useState<ApiChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(options?.skip ? false : true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.set("academic_year", academicYear);

      const res = await fetch(`/api/parent/children?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setChildren(data.data);
        if (data.data.length > 0) {
          setSelectedChildId((prev) => {
            if (prev && data.data.some((c: ApiChild) => c._id === prev)) {
              return prev;
            }
            return data.data[0]._id;
          });
        } else {
          setSelectedChildId(null);
        }
      } else {
        setError(data.message || "Failed to fetch children");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  }, [academicYear]);

  useEffect(() => {
    // Skip if explicitly told to, or if user is not a parent
    if (options?.skip || user?.role !== "parent") {
      setIsLoading(false);
      return;
    }
    fetchChildren();
  }, [user, academicYear, fetchChildren, options?.skip]);

  const selectedChild = children.find(c => c._id === selectedChildId) || null;

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    isLoading,
    error,
    refresh: fetchChildren,
  };
}
