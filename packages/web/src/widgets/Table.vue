<template>
  <div class="overflow-x-auto">
    <table class="min-w-full border border-[#ddd] rounded-md divide-y divide-[#ddd]">
      <thead>
        <tr class="bg-[#f0f0f0]">
          <th
            v-for="col in columns"
            :key="col.key || col.dataIndex"
            class="py-3 px-4 text-left text-[#333] font-semibold"
            :class="col.thClass || ''"
          >
            {{ col.title }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[#eee]">
        <tr
          v-for="(row, rowIndex) in data"
          :key="row.key || rowIndex"
          class="odd:bg-white even:bg-[#f9f9f9] hover:bg-[#e0e0e0]"
        >
          <td
            v-for="col in columns"
            :key="col.key || col.dataIndex"
            class="py-2 px-4"
            :class="col.tdClass || ''"
          >
            <slot
              :name="`cell-${col.dataIndex}`"
              :row="row"
              :value="row[col.dataIndex]"
              :column="col"
            >
              {{ row[col.dataIndex] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// import { PropType } from 'vue'; // Removed unused import

interface Column {
  title: string;
  dataIndex: string;
  key?: string;
  thClass?: string;
  tdClass?: string;
}

defineProps<{
  columns: Column[];
  data: Record<string, any>[];
}>();
</script>
