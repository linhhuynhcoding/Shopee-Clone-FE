import { useMutation, useQuery } from "@tanstack/react-query"
import userApi from "@uth/apis/user.api"
import Input from "@uth/components/Input"
import Button from "@uth/components/Button"
import formatEmail from "@uth/utils/formatEmail"
import { userSchema, UserSchemaType } from "@uth/schemas/user.schema"
import { Controller, useForm } from "react-hook-form"
import InputNumber from "../InputNumber"
import { useEffect, useMemo, useRef, useState } from "react"
import defaultValue from "@uth/constants/defaultValue"
import DateForm from "../DateForm"
import { yupResolver } from "@hookform/resolvers/yup"
import { toast } from "react-toastify"
import { useAuth } from "@uth/contexts/auth.context"
import { setUserProfileToLS } from "@uth/utils/auth.http"
import Avatar from "react-avatar"


export default function ProfileComponent() {
  const [file, setFile] = useState<File>()
  const previewAvatar = useMemo(() => {
    return file ? URL.createObjectURL(file) : ''
  }, [file])

  const fileRef = useRef<HTMLInputElement>(null)
  const { setUser } = useAuth()
  const {control, register, handleSubmit, setValue, setError, watch, formState: { errors }} = useForm<UserSchemaType>({
    defaultValues: {
      gender: 2,
      name: '',
      phone: '',
      avatar: '',
      dob: defaultValue.date_of_birth
    },
    resolver: yupResolver(userSchema)
  })

  const avatar = watch('avatar')

  const { data: profileData, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile
  })
  const profile = profileData?.result.user_profile

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile
  })
  const uploadAvatarMutation = useMutation(userApi.uploadAvatar)
  
  useEffect(() => {
    if(profile) {
      setValue('name', profile.name || '')
      setValue('avatar', profile.avatar || '')
      setValue('phone', profile.phone || '')
      setValue('dob', profile.dob ? new Date(profile.dob) : defaultValue.date_of_birth)
      setValue('gender', profile.gender)
    }
  }, [profile, setValue])

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (file) {
        const form = new FormData()
        form.append('image', file as Blob)
        const uploadResult = await uploadAvatarMutation.mutateAsync(form)
        const avatarUrl = uploadResult.data.result.url
        setValue('avatar', avatarUrl)
      }
      const result = await updateProfileMutation.mutateAsync({...data, dob: data.dob?.toISOString()})
      console.log(result.result.user_profile)
      setUser(result.result.user_profile)
      setUserProfileToLS(result.result.user_profile)
  
      toast.success(result.message)
      refetch()
    } catch (error) {
      console.log(error)
    }
  })

  const handleUpload = () => {
    fileRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileFromLocal = event.target.files?.[0]
    setFile(fileFromLocal)
  }

  return (
    <div className="bg-white rounded-md px-2 md:px-7 pb-10 md:pb-20 shadow">
      <div className="border-b border-b-gray-200 py-6">
        <h1 className="text-lg font-medium capitalize text-gray-900">My Profile</h1>
        <div className="mt-1 text-sm text-gray-700">
          Manage and protect your account
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col-reverse md:flex-row md:items-start">
        <div className="mt-6 flex-grow pr-12 md:mt-0">
          <div className="flex flex-wrap flex-col sm:flex-row">
            <div className="sm:w-[20%] truncate pt-3 sm:text-right capitalize">Username</div>
            <div className="sm:w-[80%] sm:pl-5">
              <div className="pt-3 text-gray-700">{profile?.username}</div>
            </div>
          </div>
          <div className="flex flex-wrap mt-4 flex-col sm:flex-row">
            <div className="sm:w-[20%] truncate pt-3 sm:text-right capitalize">Email</div>
            <div className="sm:w-[80%] sm:pl-5">
              <div className="pt-3 text-gray-700">{formatEmail(profile?.email as string)}</div>
            </div>
          </div>
          <div className="flex flex-wrap mt-8 flex-col sm:flex-row">
            <div className="sm:w-[20%] truncate pt-3 sm:text-right capitalize">Name</div>
            <div className="sm:w-[80%] sm:pl-5">
              <Input placeholder="Name" className="mt-0" type='text' errorMessage={errors.name?.message} name='name' register={register} classNameInput="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-gray-500 focus:shadow-sm" />
            </div>
          </div>
          <div className="flex flex-wrap mt-6 flex-col sm:flex-row">
            <div className="sm:w-[20%] truncate pt-3 sm:text-right capitalize">Phone number</div>
            <div className="sm:w-[80%] sm:pl-5">
              <Controller
                control={control}
                name='phone'
                render={({field}) => (
                  <InputNumber className="mt-0" placeholder="Number phone" errorMessage={errors.phone?.message}  classNameInput="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-gray-500 focus:shadow-sm"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
          <div className="flex flex-wrap flex-col sm:flex-row">
            <div className="sm:w-[20%] truncate pt-3 sm:text-right capitalize">Gender</div>
            <div className="sm:w-[80%] sm:pl-5 flex items-end">
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={0}
                        checked={field.value === 0}
                        onChange={() => field.onChange(0)}
                        className="mr-2"
                      />
                      Male
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={1}
                        checked={field.value === 1}
                        onChange={() => field.onChange(1)}
                        className="mr-2"
                      />
                      Female
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value={2}
                        checked={field.value === 2}
                        onChange={() => field.onChange(2)}
                        className="mr-2"
                      />
                      Other
                    </label>
                  </div>
                )}
              />
            </div>
          </div>
          <Controller 
            control={control}
            name='dob'
            render={({field}) => (
              <DateForm errorMessage={errors.dob?.message} value={field.value} onChange={field.onChange} />
            )}
          />
          <div className="flex flex-wrap mt-6 flex-col sm:flex-row">
            <div className="sm:w-[20%] sm:mr-5 pt-3"></div>
            <Button type="submit" className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-8 py-2.5 text-center mt-4">Save</Button>
          </div>
        </div>
        <div className="flex justify-center md:w-72 md:border-l md:border-l-gray-200">
          <div className="flex flex-col items-center">
            <div className="my-5 h-24 w-24">
            {profile?.avatar
            ? <img 
              src={previewAvatar || avatar}
              className="w-full h-full rounded-full object-cover"
              />
            : <Avatar name={profile?.username || 'user'} size="45" round={true}/>}
            </div>
            <input ref={fileRef} onChange={handleFileChange} type="file" name="" className="hidden" accept=".jpg,.jpeg,.png" id="" />
            <button type="button" onClick={handleUpload} className="h-10 flex items-center justify-end rounded-md border bg-white px-6 text-sm text-gray-600 shadow-sm">
              Select Image
            </button>
            <div className="text-gray-400 mt-3">
              <p>File size: maximum 1 MB</p>
              <p>File extension: .JPEG, .PNG</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
