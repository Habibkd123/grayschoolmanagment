"use client";
import { useState, useEffect, useCallback } from "react";

export function useBuses() {
  const [buses, setBuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/transport/buses");
      const data = await res.json();
      if (data.success) {
        setBuses(data.data.map((b: any) => ({ ...b, id: b._id })));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  const addBus = async (busData: any) => {
    const res = await fetch("/api/transport/buses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(busData),
    });
    const data = await res.json();
    if (data.success) {
      setBuses((prev) => [{ ...data.data, id: data.data._id }, ...prev]);
    }
    return data;
  };

  const updateBus = async (id: string, busData: any) => {
    const res = await fetch(`/api/transport/buses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(busData),
    });
    const data = await res.json();
    if (data.success) {
      setBuses((prev) => prev.map((b) => (b.id === id ? { ...data.data, id: data.data._id } : b)));
    }
    return data;
  };

  const deleteBus = async (id: string) => {
    const res = await fetch(`/api/transport/buses/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setBuses((prev) => prev.filter((b) => b.id !== id));
    }
    return data;
  };

  return { buses, isLoading, error, fetchBuses, addBus, updateBus, deleteBus };
}

export function useRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/transport/routes");
      const data = await res.json();
      if (data.success) {
        setRoutes(data.data.map((r: any) => ({ ...r, id: r._id })));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const addRoute = async (routeData: any) => {
    const res = await fetch("/api/transport/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(routeData),
    });
    const data = await res.json();
    if (data.success) {
      setRoutes((prev) => [{ ...data.data, id: data.data._id }, ...prev]);
    }
    return data;
  };

  const updateRoute = async (id: string, routeData: any) => {
    const res = await fetch(`/api/transport/routes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(routeData),
    });
    const data = await res.json();
    if (data.success) {
      setRoutes((prev) => prev.map((r) => (r.id === id ? { ...data.data, id: data.data._id } : r)));
    }
    return data;
  };

  const deleteRoute = async (id: string) => {
    const res = await fetch(`/api/transport/routes/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    }
    return data;
  };

  return { routes, isLoading, error, fetchRoutes, addRoute, updateRoute, deleteRoute };
}

export function useAllocations() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/transport/allocations");
      const data = await res.json();
      if (data.success) {
        setAllocations(data.data.map((a: any) => ({ ...a, id: a._id || a.id })));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const addAllocation = async (allocData: any) => {
    const res = await fetch("/api/transport/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allocData),
    });
    const data = await res.json();
    if (data.success) {
      fetchAllocations(); // Refetch to get populated data
    }
    return data;
  };

  const updateAllocation = async (id: string, allocData: any) => {
    const res = await fetch(`/api/transport/allocations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allocData),
    });
    const data = await res.json();
    if (data.success) {
      fetchAllocations(); // Refetch to get populated data
    }
    return data;
  };

  const deleteAllocation = async (id: string) => {
    const res = await fetch(`/api/transport/allocations/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setAllocations((prev) => prev.filter((a) => a.id !== id));
    }
    return data;
  };

  return { allocations, isLoading, error, fetchAllocations, addAllocation, updateAllocation, deleteAllocation };
}
