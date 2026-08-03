import {create} from 'zustand'
import { UiState } from '../types'

export const useUiStore = create<UiState>((set)=>({
    selectedDocumentId: null,
    selectDocument: (id) => set({selectedDocumentId:id}),

    uploadDialogOpen:false,
    openUploadDialog: () => set({uploadDialogOpen:true}),
    closeUploadDialog: () => set({uploadDialogOpen:false}),

    promptDrafts:{},
    setPromptDraft: (documentId,value) => {
        set((state) => ({
            promptDrafts: {...state.promptDrafts, [documentId]:value}
        }))
    },

    queryHistory: {},
    addQueryHistoryEntry: (documentId, entry) => {
        set((state) => ({
            queryHistory: {
                ...state.queryHistory,
                [documentId]: [entry, ...(state.queryHistory[documentId] ?? [])],
            }
        }))
    }
}))