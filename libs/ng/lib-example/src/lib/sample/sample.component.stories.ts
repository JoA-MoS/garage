import { Meta, moduleMetadata, Story } from '@storybook/angular';

import { SampleComponent } from './sample.component';

export default {
  title: 'SampleComponent',
  component: SampleComponent,
  decorators: [
    moduleMetadata({
      imports: [],
    }),
  ],
} as Meta<SampleComponent>;

const Template: Story<SampleComponent> = (args: SampleComponent) => ({
  props: args,
});

export const Primary = Template.bind({});

Primary.args = {
  name: 'Default Value',
};
