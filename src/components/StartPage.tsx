import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Input from '@mui/material/Input'
import IconButton from '@mui/material/IconButton'
import LinkIcon from '@mui/icons-material/Link'
import RunIcon from '@mui/icons-material/PlayArrow'
import AppLogo from './AppLogo'
import * as validation from '../utils/validation'
import { useForm, SubmitHandler } from 'react-hook-form'
import { styled, alpha } from '@mui/material/styles'

interface StartPageProps {
  onNavigate: (url: string) => void
}

const Root = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: theme.palette.background.default,
  gap: theme.spacing(4),
}))

const Logo = styled(AppLogo)(() => ({
  width: 120,
  height: 'auto',
}))

const Form = styled('form')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  height: 48,
  width: 500,
  [theme.breakpoints.down('md')]: {
    width: 350,
  },
}))

const InputIcon = styled(LinkIcon)(({ theme }) => ({
  width: theme.spacing(3),
  height: theme.spacing(3),
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  left: theme.spacing(1.5),
}))

const InputField = styled(Input)(({ theme }) => ({
  padding: theme.spacing(0, 6),
  height: '100%',
  width: '100%',
  borderRadius: 5,
  backgroundColor: alpha(theme.palette.common.white, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.18),
  },
  '&:hover:not(.Mui-disabled):before': {
    borderBottom: 'none',
  },
  '&:before': {
    borderBottom: 'none',
  },
  fontSize: '1.1rem',
}))

const SubmitButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
}))

const StartPage = ({ onNavigate }: StartPageProps) => {
  const { register, handleSubmit } = useForm({
    mode: 'onChange',
  })

  const onSubmit: SubmitHandler<any> = values => {
    const url = values.url.replace(/^(?!(?:f|ht)tps?:\/\/)/, 'https://')
    onNavigate(url)
  }

  return (
    <Root>
      <Logo />

      <Typography variant="h4" color="textPrimary" fontWeight={600}>
        Responsive Viewer
      </Typography>

      <Typography variant="body1" color="textSecondary">
        Entrez une URL pour commencer
      </Typography>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputIcon />

        <InputField
          placeholder="https://example.com"
          autoComplete="off"
          autoFocus
          {...register('url', {
            required: true,
            validate: {
              url: validation.url,
            },
          })}
        />

        <SubmitButton type="submit" aria-label="Go" color="primary">
          <RunIcon />
        </SubmitButton>
      </Form>
    </Root>
  )
}

export default StartPage
