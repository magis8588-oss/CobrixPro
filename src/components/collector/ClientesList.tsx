import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useConfigInteres } from "@/hooks/useConfigInteres";

/* ------- utils ------- */
const useDebouncedValue = (value: string, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

// formato de moneda: usamos `currency` directamente donde se necesita

export default function ClientesList() {
  const { user } = useAuth();
  const { monedaSymbol, loading: configLoading } = useConfigInteres();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] =
    useState<"todos" | "al_dia" | "mora" | "renovado" | "completado">("todos");
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const currency = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    []
  );

  /* ------- data load (wait for user id) ------- */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("clientes")
          .select("*")
          .eq("cobrador_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!cancelled && data) setClientes(data as Cliente[]);
      } catch (e) {
        console.error("Error loading clientes:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /* ------- helpers ------- */
  const filteredClientes = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return clientes.filter((c) => {
      const matchesSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        c.telefono?.includes(q) ||
        c.cedula?.includes(q);
      const matchesFilter = filterEstado === "todos" || c.estado === filterEstado;
      return matchesSearch && matchesFilter;
    });
  }, [clientes, debouncedSearch, filterEstado]);

  const getEstadoConfig = (estado: Cliente["estado"]) => {
    switch (estado) {
      case "al_dia":
        return {
          icon: CheckCircle,
          label: "Al Día",
          bg: "bg-green-100",
          text: "text-green-700",
          ring: "ring-green-200",
          pill: "bg-green-600",
        };
      case "mora":
        return {
          icon: Clock,
          label: "En Mora",
          bg: "bg-orange-100",
          text: "text-orange-700",
          ring: "ring-orange-200",
          pill: "bg-orange-600",
        };
      case "renovado":
        return {
          icon: AlertCircle,
          label: "Renovado",
          bg: "bg-blue-100",
          text: "text-blue-700",
          ring: "ring-blue-200",
          pill: "bg-blue-600",
        };
      case "completado":
        return {
          icon: CheckCircle,
          label: "Completado",
          bg: "bg-gray-100",
          text: "text-gray-700",
          ring: "ring-gray-200",
          pill: "bg-gray-600",
        };
      default:
        return {
          icon: AlertCircle,
          label: estado,
          bg: "bg-gray-100",
          text: "text-gray-700",
          ring: "ring-gray-200",
          pill: "bg-gray-600",
        };
    }
  };

  const handleRenovarCliente = async (cliente: Cliente) => {
    if (
      !window.confirm(
        `¿Seguro que deseas renovar a ${cliente.nombre}? Esto marcará la deuda anterior como completada y creará un nuevo préstamo.`
      )
    )
      return;

    try {
      const { error: updateError } = await supabase
        .from("clientes")
        .update({
          estado: "completado",
          saldo_pendiente: 0,
          cuotas_pagadas: cliente.cuotas_totales,
          cuotas_pendientes: 0,
        })
        .eq("id", cliente.id);
      if (updateError) throw updateError;

      // Antes de insertar, verificar que no exista un cliente activo con la misma cédula
      const { data: existingActive, error: checkError } = await supabase
        .from('clientes')
        .select('id')
        .eq('cedula', cliente.cedula)
        .neq('estado', 'completado')

      if (checkError) throw checkError
      if (existingActive && existingActive.length > 0) {
        throw new Error('Ya existe un cliente con esta cédula y un cobro activo')
      }

      const { error: insertError } = await supabase.from("clientes").insert({
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        monto_prestamo: cliente.monto_prestamo,
        tipo_cobro: cliente.tipo_cobro,
        valor_cuota: cliente.valor_cuota,
        cuotas_totales: cliente.cuotas_totales,
        cuotas_pagadas: 0,
        cuotas_pendientes: cliente.cuotas_totales,
        saldo_pendiente: cliente.monto_prestamo,
        proximo_cobro: new Date().toISOString().split("T")[0],
        estado: "al_dia",
        cobrador_id: cliente.cobrador_id,
        created_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;

      alert("Cliente renovado correctamente. El historial queda registrado.");

      // reload
      setClientes((prev) =>
        prev.map((c) =>
          c.id === cliente.id
            ? { ...c, estado: "completado", saldo_pendiente: 0, cuotas_pagadas: c.cuotas_totales, cuotas_pendientes: 0 }
            : c
        )
      );
    } catch (error: any) {
      alert("Error al renovar cliente: " + (error?.message || error));
    }
  };

  /* ------- modal a11y ------- */
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showModal) {
      modalRef.current?.focus();
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowModal(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [showModal]);

  /* ------- UI ------- */
  if (loading || configLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white shadow-sm border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold text-gray-900">
            Mis Clientes
          </h2>
          <p className="text-gray-600">
            {filteredClientes.length} cliente
            {filteredClientes.length !== 1 ? "s" : ""} asignado
            {filteredClientes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filtros chips (scroll en móvil) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {([
            { key: "todos", label: "Todos" },
            { key: "al_dia", label: "Al Día" },
            { key: "mora", label: "En Mora" },
            { key: "renovado", label: "Renovados" },
            { key: "completado", label: "Completados" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterEstado(f.key)}
              className={[
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                filterEstado === f.key
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
          aria-hidden
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, teléfono o cédula..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          aria-label="Buscar clientes"
        />
      </div>

      {/* Móvil: tarjetas */}
      <div className="grid gap-4 sm:hidden">
        {filteredClientes.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No se encontraron clientes</p>
          </div>
        ) : (
          filteredClientes.map((cliente) => {
            const cfg = getEstadoConfig(cliente.estado);
            const EstadoIcon = cfg.icon;
            return (
              <article
                key={cliente.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <header className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-base text-gray-900">
                    {cliente.nombre}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ring-1 ${cfg.ring}`}
                  >
                    {EstadoIcon && <EstadoIcon size={14} aria-hidden />}
                    {cfg.label}
                  </span>
                </header>

                <p className="text-sm text-gray-600 mt-1">
                  {cliente.cedula} • {cliente.telefono}
                </p>

                <div className="mt-2 text-sm">
                  Saldo:{" "}
                  <span className="font-semibold text-primary-700">
                    {currency.format(cliente.saldo_pendiente || 0).replace("COP", monedaSymbol)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="col-span-2 p-2 rounded-lg font-medium shadow bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      setSelectedCliente(cliente);
                      setShowModal(true);
                    }}
                  >
                    Cobrar
                  </button>
                  <button
                    className="p-2 rounded-lg font-medium shadow bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {/* abrir historial */}}
                  >
                    Historial
                  </button>
                  {cliente.estado !== "completado" &&
                    cliente.cuotas_pendientes <= 10 &&
                    cliente.cuotas_pendientes > 0 && (
                      <button
                        className="p-2 rounded-lg font-medium shadow bg-purple-600 text-white hover:bg-purple-700"
                        onClick={() => handleRenovarCliente(cliente)}
                      >
                        Renovar
                      </button>
                    )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop: tabla responsiva */}
      <div className="hidden sm:block">
        {filteredClientes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Cédula</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Teléfono</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Dirección</th>
                  <th className="px-4 py-3 text-left">Préstamo</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left">Cuotas</th>
                  <th className="px-4 py-3 text-left">Saldo</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Próx. cobro</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-center sticky right-0 bg-gray-50">Acción</th>
                  <th className="px-4 py-3 text-center sticky right-0 bg-gray-50 hidden md:table-cell">
                    Renovar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClientes.map((c) => {
                  const cfg = getEstadoConfig(c.estado);
                  const EstadoIcon = cfg.icon;
                  const fecha = c.proximo_cobro
                    ? (() => {
                        const [y, m, d] = c.proximo_cobro.split("T")[0].split("-").map(Number);
                        return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                        });
                      })()
                    : "-";
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                      <td className="px-4 py-3 text-gray-700">{c.cedula}</td>
                      <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{c.telefono}</td>
                      <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">
                        {c.direccion || "-"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {currency.format(c.monto_prestamo || 0).replace("COP", monedaSymbol)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {c.tipo_cobro}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{c.cuotas_pagadas}</span>/{c.cuotas_totales}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary-700">
                        {currency.format(c.saldo_pendiente || 0).replace("COP", monedaSymbol)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{fecha}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${cfg.bg} ${cfg.text} ring-1 ${cfg.ring}`}
                        >
                          {EstadoIcon && <EstadoIcon size={14} aria-hidden />}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
                          onClick={() => {
                            setSelectedCliente(c);
                            setShowModal(true);
                          }}
                        >
                          Ver Detalles
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {c.estado !== "completado" &&
                          c.cuotas_pendientes <= 10 &&
                          c.cuotas_pendientes > 0 && (
                            <button
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                              onClick={() => handleRenovarCliente(c)}
                            >
                              Renovar
                            </button>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalles */}
      {showModal && selectedCliente && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cliente-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-xl bg-white p-6 text-gray-900 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Cerrar"
              className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={() => setShowModal(false)}
            >
              <X size={18} />
            </button>
            <h3 id="cliente-title" className="text-xl font-bold mb-4 text-primary-700">
              Detalles del Cliente
            </h3>

            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">Nombre:</span> {selectedCliente.nombre}</div>
              <div><span className="font-semibold">Cédula:</span> {selectedCliente.cedula}</div>
              <div><span className="font-semibold">Teléfono:</span> {selectedCliente.telefono}</div>
              <div><span className="font-semibold">Dirección:</span> {selectedCliente.direccion || "-"}</div>
              <div><span className="font-semibold">Monto Préstamo:</span> {currency.format(selectedCliente.monto_prestamo || 0).replace("COP", monedaSymbol)}</div>
              <div><span className="font-semibold">Tipo de Cobro:</span> {selectedCliente.tipo_cobro}</div>
              <div><span className="font-semibold">Valor Cuota:</span> {currency.format(selectedCliente.valor_cuota || 0).replace("COP", monedaSymbol)}</div>
              <div><span className="font-semibold">Cuotas Pagadas:</span> {selectedCliente.cuotas_pagadas} / {selectedCliente.cuotas_totales}</div>
              <div><span className="font-semibold">Saldo Pendiente:</span> {currency.format(selectedCliente.saldo_pendiente || 0).replace("COP", monedaSymbol)}</div>
              <div><span className="font-semibold">Próximo Cobro:</span> {selectedCliente.proximo_cobro?.split("T")[0]}</div>
              <div><span className="font-semibold">Estado:</span> {selectedCliente.estado}</div>
              <div><span className="font-semibold">Fecha de Registro:</span> {selectedCliente.created_at?.split("T")[0]}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
