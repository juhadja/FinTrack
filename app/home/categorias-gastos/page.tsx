"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";

interface CategoriaGasto {
  id: string;
  nome: string;
  created_at: string;
}

export default function CategoriasGastosPage() {
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategorias = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("categorias_gastos").select("*").order("nome");
    setCategorias(data ?? []);
  }, []);

  useEffect(() => {
    fetchCategorias();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setNome("");
    setModalOpen(true);
  };

  const openEdit = (categoria: CategoriaGasto) => {
    setEditingId(categoria.id);
    setNome(categoria.nome);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (editingId) {
      await supabase.from("categorias_gastos").update({ nome }).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("categorias_gastos").insert({ user_id: user.id, nome });
    }

    setModalOpen(false);
    setNome("");
    setEditingId(null);
    setLoading(false);
    fetchCategorias();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    const supabase = createClient();
    await supabase.from("categorias_gastos").delete().eq("id", id);
    fetchCategorias();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBackButton/>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Categorias de Gastos</h2>
            <Button onClick={openCreate} className="bg-primary text-background hover:bg-primary/90 font-semibold text-sm sm:text-base w-full sm:w-auto">
              <Plus size={16} className="mr-1 sm:mr-2" /> Nova Categoria
            </Button>
          </div>

          <Card className="border-primary/20 bg-background">
            <CardContent className="pt-6">
              {categorias.length === 0 ? (
                <p className="text-foreground/50 text-center py-8">Nenhuma categoria cadastrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/20">
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Nome</th>
                        <th className="text-right py-3 px-4 text-foreground font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map((cat) => (
                        <tr key={cat.id} className="border-b border-primary/10">
                          <td className="py-3 px-4 text-foreground">{cat.nome}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit(cat)} className="border-primary/30 text-primary hover:bg-primary hover:text-background">
                                <Pencil size={16} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(cat.id)} className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-md border-primary/20 bg-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-foreground">
                  {editingId ? "Editar Categoria" : "Nova Categoria de Gastos"}
                </CardTitle>
                <button onClick={() => setModalOpen(false)} className="text-foreground/50 hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-foreground">Nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Ex: Alimentação, Transporte..."
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-background border-primary/30 text-foreground focus:border-primary"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-background hover:bg-primary/90 font-semibold" disabled={loading}>
                  {loading ? "Salvando..." : editingId ? "Salvar Alteração" : "Cadastrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
