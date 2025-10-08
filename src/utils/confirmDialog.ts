import { createApp, ref } from 'vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
let instance: any = null;

export const useConfirmDialog = () => {
    const showConfirmDialog = (message: string): Promise<number> => {
        return new Promise((resolve) => {
            // 清理现有实例
            if (instance) {
                const container = instance.$el.parentElement;
                if (container) {
                    document.body.removeChild(container);
                }
                instance.unmount();
                instance = null;
            }

            const container = document.createElement('div');
            document.body.appendChild(container);

            const visible = ref(true);

            instance = createApp(ConfirmDialog, {
                visible: visible.value,
                message,
                'onUpdate:visible': (val: boolean) => {
                    visible.value = val;
                },
                onConfirm: () => {
                    resolve(1);
                    cleanup();
                },
                onCancel: () => {
                    resolve(2);
                    cleanup();
                }
            });

            instance.mount(container);

            // 添加清理函数
            const cleanup = () => {
                if (container && container.parentNode) {
                    document.body.removeChild(container);
                }
                if (instance) {
                    instance.unmount();
                    instance = null;
                }
            };
        });
    };

    return {
        showConfirmDialog
    };
};
