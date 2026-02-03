"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";

interface FonteRenda {
  id: string;
  nome: string;
  created_at: string;
}

export default function FontesRendaPage() {
  const [fontes, setFontes] = useState<FonteRenda[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFontes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("fontes_renda").select("*").order("nome");
    setFontes(data ?? []);
  }, []);

  useEffect(() => {
    fetchFontes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setNome("");
    setModalOpen(true);
  };

  const openEdit = (fonte: FonteRenda) => {
    setEditingId(fonte.id);
    setNome(fonte.nome);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (editingId) {
      await supabase.from("fontes_renda").update({ nome }).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("fontes_renda").insert({ user_id: user.id, nome });
    }

    setModalOpen(false);
    setNome("");
    setEditingId(null);
    setLoading(false);
    fetchFontes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fonte?")) return;
    const supabase = createClient();
    await supabase.from("fontes_renda").delete().eq("id", id);
    fetchFontes();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBackButton/>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Fontes de Renda</h2>
            <Button onClick={openCreate} className="w-full sm:w-auto bg-primary text-background hover:bg-primary/90 text-sm sm:text-base">
              <Plus size={18} className="mr-2" /> Nova Fonte
            </Button>
          </div>

          <Card className="border-primary/20 bg-background">
            <CardContent className="pt-6">
              {fontes.length === 0 ? (
                <p className="text-foreground/50 text-center py-8">Nenhuma fonte de renda cadastrada.</p>
              ) : (
                <>
                  {/* Visualização Desktop - Tabela */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-primary/20">
                          <th className="text-left py-3 px-4 text-foreground font-semibold">Nome</th>
                          <th className="text-right py-3 px-4 text-foreground font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fontes.map((fonte) => (
                          <tr key={fonte.id} className="border-b border-primary/10">
                            <td className="py-3 px-4 text-foreground">{fonte.nome}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit(fonte)} className="border-primary/30 text-primary hover:bg-primary hover:text-background">
                                  <Pencil size={16} />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(fonte.id)} className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Visualização Mobile - Cards */}
                  <div className="md:hidden space-y-3">
                    {fontes.map((fonte) => (
                      <div key={fonte.id} className="border border-primary/20 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-foreground">{fonte.nome}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(fonte)} className="border-primary/30 text-primary hover:bg-primary hover:text-background h-8 w-8 p-0">
                              <Pencil size={14} />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(fonte.id)} className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white h-8 w-8 p-0">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-primary/20 bg-background">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl text-foreground">
                  {editingId ? "Editar Fonte" : "Nova Fonte de Renda"}
                </CardTitle>
                <button onClick={() => setModalOpen(false)} className="text-foreground/50 hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm text-foreground">Nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Ex: Salário, Freelance..."
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-background border-primary/30 text-foreground focus:border-primary"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-background hover:bg-primary/90 font-semibold mt-4" disabled={loading}>
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
