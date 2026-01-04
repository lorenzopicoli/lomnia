import { SimpleGrid, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { PlaceOfInterestFormValues } from "./AddPlaceOfInterestContainer";

export function AddPlaceOfInterestAddressForm(props: { form: UseFormReturnType<PlaceOfInterestFormValues> }) {
  const { form } = props;
  const { address } = form.values;
  return (
    <SimpleGrid cols={2}>
      <TextInput
        value={address?.houseNumber}
        onChange={(e) => form.setFieldValue("address.houseNumber", e.target.value)}
        label="House Number"
      />
      <TextInput
        value={address?.country}
        onChange={(e) => form.setFieldValue("address.country", e.target.value)}
        label="Country"
      />
      <TextInput
        value={address?.state}
        onChange={(e) => form.setFieldValue("address.state", e.target.value)}
        label="State"
      />
      <TextInput
        value={address?.region}
        onChange={(e) => form.setFieldValue("address.region", e.target.value)}
        label="Region"
      />
      <TextInput
        value={address?.city}
        onChange={(e) => form.setFieldValue("address.city", e.target.value)}
        label="City"
      />
      <TextInput
        value={address?.county}
        onChange={(e) => form.setFieldValue("address.county", e.target.value)}
        label="County"
      />
      <TextInput
        value={address?.postcode}
        onChange={(e) => form.setFieldValue("address.postcode", e.target.value)}
        label="Postcode"
      />
      <TextInput
        value={address?.suburb}
        onChange={(e) => form.setFieldValue("address.suburb", e.target.value)}
        label="Suburb"
      />
      <TextInput
        value={address?.neighbourhood}
        onChange={(e) => form.setFieldValue("address.neighbourhood", e.target.value)}
        label="Neighbourhood"
      />
      <TextInput
        value={address?.road}
        onChange={(e) => form.setFieldValue("address.road", e.target.value)}
        label="Road"
      />
    </SimpleGrid>
  );
}
