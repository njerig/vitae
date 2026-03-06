"use client"

import Link from "next/link"
import { useCanon } from "@/lib/canon/useCanon"
import { CanonForm } from "@/lib/canon/components/CanonForm"
import { CanonList } from "@/lib/canon/components/CanonList"
import { Timeline } from "@/lib/homepage/Timeline"
import { Spinner } from "@/lib/shared/components/Spinner"
import { PageHeader } from "@/lib/shared/components/PageHeader"
import { DeleteItemModal } from "@/lib/homepage/DeleteItemModal"
import { ArchiveBin } from "@/lib/homepage/ArchiveBin"

export default function HomeClient() {
  const {
    items,
    itemTypes,
    selectedTypeId,
    setSelectedTypeId,
    stats,
    loading,
    saving,
    error,
    isAddingItem,
    editingItem,
    deletingItem,
    isDeleting,
    formRef,
    getLastEditedDate,
    refresh,
    startAdd,
    startEdit,
    cancel,
    submit,
    del,
    cancelDelete,
    confirmDelete,
  } = useCanon()

  return (
    <div className="page-container">
      <div className="page-bg-gradient"></div>
      <div className="page-accent-light"></div>

      {deletingItem && (
        <DeleteItemModal
          itemTitle={deletingItem.title}
          onConfirm={confirmDelete}
          onClose={cancelDelete}
          deleting={isDeleting}
        />
      )}

      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <PageHeader
              title="My Career History"
              subtitle="Add, edit, and manage your career items."
              actions={
                <>
                  <button
                    onClick={startAdd}
                    className="btn-primary flex items-center gap-2 rounded-lg"
                    disabled={saving || loading || itemTypes.length === 0}
                  >
                    Add Item
                    {saving || loading ? (
                      <Spinner size={20} color="white" inline />
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    )}
                  </button>
                  <Link href="/resume">
                    <button className="btn-secondary rounded-lg flex items-center gap-2">
                      Resume Builder
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </Link>
                </>
              }
            >
              <div className="pt-4 border-t" style={{ borderColor: "var(--grid)" }}>
                <Timeline items={items} itemTypes={itemTypes} />
                {getLastEditedDate() && (
                  <p className="text-xs text-right" style={{ color: "var(--ink)", opacity: 0.4 }}>
                    Last edited: {getLastEditedDate()}
                  </p>
                )}
              </div>
            </PageHeader>
          </div>

          {/* Form */}
          {isAddingItem && (
            <div ref={formRef}>
              <CanonForm
                itemTypes={itemTypes}
                editing={editingItem}
                defaultTypeId={selectedTypeId ?? undefined}
                onCancel={cancel}
                onSubmit={submit}
                saving={saving}
                error={error}
              />
            </div>
          )}

          {/* Item List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedTypeId(null)}
                className={`tab-button ${selectedTypeId === null ? "tab-button-active" : ""}`}
              >
                All ({items.length})
              </button>
              {itemTypes.map((t) => {
                const count = stats.byType.find((s) => s.id === t.id)?.count ?? 0
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`tab-button ${selectedTypeId === t.id ? "tab-button-active" : ""}`}
                  >
                    {t.display_name} ({count})
                  </button>
                )
              })}
            </div>

            {/* List header */}
            <div className="mb-6">
              <h3>
                {selectedTypeId
                  ? itemTypes.find((t) => t.id === selectedTypeId)?.display_name
                  : "All Items"}{" "}
                ({loading ? <Spinner size={12} inline /> : items.length})
              </h3>
            </div>

            <CanonList items={items} itemTypes={itemTypes} onEdit={startEdit} onDelete={del} />
          </div>

          {/* Archive Bin — shows soft-deleted items; auto-expires after 30 days */}
          <ArchiveBin onItemRestored={refresh} />
        </div>
      </div>
    </div>
  )
}
